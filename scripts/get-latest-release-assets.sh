REPO_URL='https://api.github.com/repos/alistairjcbrown/hackney-cinema-calendar/releases/latest'

RESPONSE_LIST=$(curl -L -H "Accept: application/vnd.github+json" -H "X-GitHub-Api-Version: 2022-11-28" $REPO_URL)

for f in $(echo "$RESPONSE_LIST" | grep browser_download | grep json | cut -d\" -f4);
do
    wget "$f" -P ./output/
done