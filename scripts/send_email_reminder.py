import os
import smtplib
from email.message import EmailMessage


SITE_URL = "https://yanzhang-xu.github.io/onboard/"


def required_env(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        raise RuntimeError(f"Missing GitHub Actions secret: {name}")
    return value


sender = required_env("QQ_EMAIL")
auth_code = required_env("QQ_EMAIL_AUTH_CODE")

message = EmailMessage()
message["From"] = sender
message["To"] = sender
message["Subject"] = "19:30 资料分析刷题提醒"
message.set_content(
    "今天的 10 道资料分析题已经准备好。\n\n"
    "打开题库：" + SITE_URL + "\n\n"
    "稳住速度，先找数据，再列式计算。"
)

with smtplib.SMTP_SSL("smtp.qq.com", 465, timeout=30) as smtp:
    smtp.login(sender, auth_code)
    smtp.send_message(message)

print("Reminder email sent.")
