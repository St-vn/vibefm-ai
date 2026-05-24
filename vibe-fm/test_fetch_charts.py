from fetch_charts import parse_artist_title


def test_simple_split():
    assert parse_artist_title("The Weeknd - Blinding Lights") == ("The Weeknd", "Blinding Lights")


def test_hyphenated_artist():
    assert parse_artist_title("Jay-Z - 99 Problems") == ("Jay-Z", "99 Problems")


def test_hyphen_in_title():
    assert parse_artist_title("Artist - Song - Remix") == ("Artist", "Song - Remix")


def test_no_delimiter_returns_none():
    assert parse_artist_title("MalformedRowNoSeparator") is None


def test_empty_returns_none():
    assert parse_artist_title("") is None
