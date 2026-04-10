FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY ./app /app/app

EXPOSE 8000

# 2 workers 足够，这个服务 QPS 极低
# access-log 关闭，由应用层自己记录关键日志
CMD ["uvicorn", "app.main:app", \
     "--host", "0.0.0.0", \
     "--port", "8000", \
     "--workers", "2", \
     "--log-level", "info", \
     "--no-access-log"]
