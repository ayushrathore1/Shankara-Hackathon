const mongoose = require('mongoose');

/**
 * Course Schema - Groups related lectures into organized courses
 * Designed for scalability with 1000s of lectures
 */
const courseSchema = new mongoose.Schema({
  // Core Course Info
  name: {
    type: String,
    required: [true, 'Course name is required'],
    trim: true,
    maxlength: [200, 'Name cannot exceed 200 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    index: true
  },
  provider: {
    type: String,
    required: true,
    trim: true // e.g., "Harvard edX", "MIT OpenCourseWare", "freeCodeCamp"
  },
  description: {
    type: String,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  thumbnail: {
    type: String,
    default: ''
  },

  // Categorization
  category: {
    type: String,
    required: true,
    enum: ['web-dev', 'java', 'javascript', 'data-science', 'python', 'dsa', 'devops', 'mobile', 'c-programming', 'other'],
    index: true
  },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'all-levels'],
    default: 'beginner'
  },
  targetAudience: {
    type: String,
    default: '' // e.g., "Students new to programming"
  },
  prerequisites: [{
    type: String
  }],
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],

  // Course Statistics
  lectureCount: {
    type: Number,
    default: 0
  },
  totalDuration: {
    type: String,
    default: '' // e.g., "8h 30m"
  },
  averageScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },

  // AI-Generated Course Overview
  aiOverview: {
    summary: String,
    learningObjectives: [String],
    keyTopics: [String],
    recommendedPath: String, // How to approach the course
    generatedAt: Date
  },

  // Metadata
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  externalUrl: {
    type: String // Link to original course page (e.g., edX course page)
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // ML Classification metadata
  mlGenerated: {
    type: Boolean,
    default: false
  },
  mlConfidence: {
    type: Number,
    min: 0,
    max: 1
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Auto-generate slug from name and provider
courseSchema.pre('save', function() {
  if (this.isModified('name') || this.isModified('provider')) {
    this.slug = `${this.provider}-${this.name}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
});

// Virtual for lectures (populated separately)
courseSchema.virtual('lectures', {
  ref: 'FreeResource',
  localField: '_id',
  foreignField: 'courseId',
  options: { sort: { lectureOrder: 1 } }
});

// Static: Find by category
courseSchema.statics.findByCategory = function(category, options = {}) {
  const { page = 1, limit = 10 } = options;
  
  return this.find({ isActive: true, category })
    .sort({ isFeatured: -1, averageScore: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

// Static: Get featured courses
courseSchema.statics.getFeatured = function(limit = 5) {
  return this.find({ isActive: true, isFeatured: true })
    .sort({ averageScore: -1 })
    .limit(limit);
};

// Static: Search courses
courseSchema.statics.search = function(query, options = {}) {
  const { page = 1, limit = 10 } = options;
  
  return this.find({
    isActive: true,
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { provider: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { tags: { $in: [new RegExp(query, 'i')] } }
    ]
  })
    .sort({ averageScore: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

// Instance method: Update statistics from lectures
courseSchema.methods.updateStats = async function() {
  const FreeResource = mongoose.model('FreeResource');
  
  // Get all lectures for this course
  const lectures = await FreeResource.find({ courseId: this._id, isActive: true })
    .select('codeLearnnScore duration');
  
  if (lectures.length > 0) {
    this.lectureCount = lectures.length;
    
    // Calculate average score
    const totalScore = lectures.reduce((sum, l) => sum + (l.codeLearnnScore || 0), 0);
    this.averageScore = Math.round(totalScore / lectures.length);
    
    // Parse duration strings and calculate total minutes
    let totalMinutes = 0;
    for (const lecture of lectures) {
      if (lecture.duration) {
        // Parse duration string like "3h 27m" or "45m" or "1h 5m"
        const hoursMatch = lecture.duration.match(/(\d+)h/);
        const minutesMatch = lecture.duration.match(/(\d+)m/);
        
        const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
        const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
        
        totalMinutes += (hours * 60) + minutes;
      }
    }
    
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    this.totalDuration = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  }

  return this.save();
};

const Course = mongoose.model('Course', courseSchema);

module.exports = Course;
