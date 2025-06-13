FROM python:3.8-slim
ENV PYTHONUNBUFFERED True
ENV APP_HOME /app
WORKDIR $APP_HOME
COPY backend/ ./
RUN pip install -r requirements.txt
CMD ["gunicorn", "app:app"]