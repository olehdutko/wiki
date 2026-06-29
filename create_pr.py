import subprocess, json

body = "Adds item image gallery with two tabs, bulk upload, fullscreen viewer, primary image selection, 40x40 DataGrid preview, and 400x400 hover preview. Includes server endpoints and SQL migration."
pr_data = json.dumps({
    "title": "feat: item image gallery",
    "head": "feat/item-image-gallery",
    "base": "main",
    "body": body
})

result = subprocess.run(
    [
        "curl", "-s", "-X", "POST",
        "-H", "Authorization: token ***",
        "-H", "Accept: application/vnd.github.v3+json",
        "https://api.github.com/repos/olehdutko/wiki/pulls",
        "-d", pr_data
    ],
    capture_output=True,
    text=True
)
print("STDOUT:", result.stdout)
print("STDERR:", result.stderr)
print("RC:", result.returncode)
