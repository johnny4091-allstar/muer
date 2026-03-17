"""
Sports skill: scores and standings via ESPN API (no key required).
"""

from typing import Any

import requests

from assistant.skills import register
from assistant.utils.logger import get_logger

log = get_logger("skill.sports")

# ESPN API endpoints (no authentication required)
_ESPN_ENDPOINTS = {
    "nfl": "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard",
    "nba": "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard",
    "mlb": "https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard",
    "nhl": "https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard",
    "mls": "https://site.api.espn.com/apis/site/v2/sports/soccer/usa.1/scoreboard",
    "soccer": "https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard",
}

_LEAGUE_ALIASES = {
    "football": "nfl", "american football": "nfl",
    "basketball": "nba",
    "baseball": "mlb",
    "hockey": "nhl", "ice hockey": "nhl",
    "soccer": "soccer", "football (soccer)": "soccer",
}


def _get_scores(league: str) -> list[str]:
    league = _LEAGUE_ALIASES.get(league.lower(), league.lower())
    url = _ESPN_ENDPOINTS.get(league)
    if not url:
        return []
    try:
        r = requests.get(url, timeout=5, headers={"User-Agent": "MuerAssistant/1.0"})
        data = r.json()
        events = data.get("events", [])
        scores = []
        for event in events[:5]:
            name = event.get("name", "")
            status = event.get("status", {}).get("type", {}).get("description", "")
            competitions = event.get("competitions", [{}])
            if competitions:
                competitors = competitions[0].get("competitors", [])
                if len(competitors) >= 2:
                    team1 = competitors[0].get("team", {}).get("shortDisplayName", "Team 1")
                    score1 = competitors[0].get("score", "0")
                    team2 = competitors[1].get("team", {}).get("shortDisplayName", "Team 2")
                    score2 = competitors[1].get("score", "0")
                    scores.append(f"{team1} {score1}, {team2} {score2} - {status}")
        return scores
    except Exception as e:
        log.error(f"ESPN API failed: {e}")
        return []


@register("get_sports_scores")
def get_sports_scores(params: dict[str, Any], tts, response_hint: str = "") -> None:
    league = params.get("league", "nba").strip().lower()
    team = params.get("team", "").strip().lower()

    scores = _get_scores(league)
    if not scores:
        tts.speak(f"I couldn't get {league.upper()} scores right now.")
        return

    if team:
        # Filter by team name
        filtered = [s for s in scores if team in s.lower()]
        if filtered:
            tts.speak(f"Here's the score for {team}: {filtered[0]}.")
        else:
            tts.speak(f"I didn't find a game for {team} today.")
        return

    league_name = league.upper()
    tts.speak(f"Here are today's {league_name} scores.")
    for score in scores[:3]:
        tts.speak(score)


@register("get_standings")
def get_standings(params: dict[str, Any], tts, response_hint: str = "") -> None:
    league = params.get("league", "nba").strip().lower()
    tts.speak(f"For full {league.upper()} standings, check ESPN or your favorite sports app.")
