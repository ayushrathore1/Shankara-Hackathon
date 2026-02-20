#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# CodeLearnn ML Classifier — Hostinger Setup Script
# Run this via SSH on your Hostinger server once.
# ═══════════════════════════════════════════════════════════════

set -e

echo "🔧 CodeLearnn ML Classifier Setup"
echo "─────────────────────────────────────"

# 1. Check Python
echo ""
echo "1️⃣  Checking Python..."
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
    echo "   ✅ Found: $($PYTHON_CMD --version)"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
    echo "   ✅ Found: $($PYTHON_CMD --version)"
else
    echo "   ❌ Python not found!"
    echo "   Please install Python 3.10+ or contact Hostinger support."
    exit 1
fi

# 2. Check pip
echo ""
echo "2️⃣  Checking pip..."
if $PYTHON_CMD -m pip --version &> /dev/null; then
    echo "   ✅ pip available"
else
    echo "   ⚠️  pip not found, installing..."
    curl -sSL https://bootstrap.pypa.io/get-pip.py | $PYTHON_CMD
fi

# 3. Install Python dependencies
echo ""
echo "3️⃣  Installing ML dependencies..."
cd "$(dirname "$0")/../ml-classifier"
$PYTHON_CMD -m pip install --user -r requirements.txt
echo "   ✅ Dependencies installed"

# 4. Pre-download the ML model (avoids slow first-request)
echo ""
echo "4️⃣  Pre-downloading sentence-transformer model (~80MB)..."
$PYTHON_CMD -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2'); print('   ✅ Model cached')"

# 5. Test the service
echo ""
echo "5️⃣  Testing ML service..."
$PYTHON_CMD -c "
from config import MONGODB_URI
from embeddings import generate_embedding
import numpy as np
vec = generate_embedding('test embedding')
assert vec.shape == (384,), f'Expected 384-dim, got {vec.shape}'
print('   ✅ Embeddings working (384-dim)')
print('   ✅ MongoDB URI configured')
"

echo ""
echo "─────────────────────────────────────"
echo "✅ Setup complete!"
echo ""
echo "The ML classifier will auto-start with Node.js."
echo "To disable: set DISABLE_ML=true in your .env"
echo "To test:    curl http://localhost:8100/health"
echo ""
