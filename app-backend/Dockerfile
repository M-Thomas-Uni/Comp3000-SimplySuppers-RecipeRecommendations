FROM python:3.12

WORKDIR /user/src/app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements

COPY . .

EXPOSE 9001

CMD ["python", "main.py"]