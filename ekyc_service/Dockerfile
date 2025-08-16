FROM python:3.11-slim-bookworm AS builder

WORKDIR /app

ENV PIP_NO_CACHE_DIR=1 \
    PIP_DEFAULT_TIMEOUT=120 \
    PIP_RETRIES=20 \
    PIP_INDEX_URL=https://pypi.org/simple \
    POETRY_INSTALLER_MAX_WORKERS=1 \
    POETRY_CACHE_DIR=/tmp/poetry-cache

RUN python -m pip install --upgrade pip setuptools wheel
RUN pip install poetry
RUN pip install gunicorn
RUN apt-get update && apt-get install -y \
    cmake build-essential pkg-config \
    libglib2.0-0 libsm6 libxext6 libxrender1 libgl1 ffmpeg \
 && rm -rf /var/lib/apt/lists/*

# Pre-install CPU-only PyTorch (phiên bản tương thích với facenet-pytorch)
RUN pip install --no-cache-dir \
    --index-url https://download.pytorch.org/whl/cpu \
    torch==2.2.2 torchvision==0.17.2 torchaudio==2.2.2

# Copy lockfiles first to leverage Docker layer cache
COPY pyproject.toml poetry.lock /app/

# Install project dependencies using Poetry (no project install)
# Lock lại dependencies để đồng bộ với pyproject trước khi install
RUN poetry config virtualenvs.create false \
    && poetry lock --no-ansi --no-interaction \
    && poetry install --no-root --no-ansi --no-interaction

# Copy application source after deps are cached
COPY . /app

# Expose the port Gunicorn will listen on
EXPOSE 8000

# Command to run the Gunicorn WSGI server.
CMD ["gunicorn", "-c", "gunicorn_config.py", "wsgi:application"]
