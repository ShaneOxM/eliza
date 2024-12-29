#!/bin/bash

# Create Python virtual environment if it doesn't exist
if [ ! -d "python/venv" ]; then
    python3 -m venv python/venv
fi

# Activate virtual environment
source python/venv/bin/activate

# Install dependencies
cd python
pip install -e .

# Deactivate virtual environment
deactivate