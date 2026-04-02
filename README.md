# Waconia

Weather data collection and charting for stations in Minnesota, the Pacific Northwest, and other locations. Data is updated throughout the day, with observations ranging from every 5 minutes to every hour depending on the source.

Live site: **[waconia.triquence.org](https://waconia.triquence.org/weather?station=KRLD&days=24h)**

---

## Overview

Waconia has two halves: a set of **gleaner** scripts that collect weather data from various sources, and a browser-based **client** that charts that data. The gleaners run on a scheduled task (every 5 minutes) on a local home-network machine and feed the results into cloud storage. The client is a static site that queries the cloud storage and renders charts — no server-side code required at request time.

## Client (this repository)

The charting page (`weather.html`) runs entirely in the browser using [Google Charts](https://developers.google.com/chart/). It queries weather data from one of two backends:

- **Cloudflare D1** — the primary data source, offering faster response times and longer history.
- **Google Sheets** — available as a backup, selectable from a dropdown on the chart page.

Each chart shows six sensor readings in two panels: ambient conditions (temperature, pressure, humidity) on top, and wind (speed, gust, direction) on the bottom. Controls let you choose a region, station, date range, and smoothing options.

An older charting page (`charts.html`) preserves samples from the original server-rendered Waconia (Rosy.asp), which produces chart images on an IIS/ASP server. The legacy ASP page now uses a MySQL backend, though it can still be configured to run with MS Access.

### Other pages

- **Q&A** (`faq.html`) — details on data sources, charting options, and the history of the project.
- **Installation guide** (`install_rosy.html`) — instructions for running the original gleaners and Rosy.asp charting page on a local network with IIS.

## Gleaners

The data-collection scripts live in a separate repository:
**[m-jim-d/waconia-gleaners-code](https://github.com/m-jim-d/waconia-gleaners-code)**

These Perl and Python scripts gather weather observations from four sources:

1. **Hanford Meteorological Station (HMS)** — screen-scraped from the HMS real-time page (Perl).
2. **NOAA Regional Weather Roundup** — Washington and Oregon pages providing data for Portland, The Dalles, and other Columbia Basin sites (Perl).
3. **Aviation Weather (METAR)** — XML feed from aviationweather.gov covering Minnesota airport stations (Python, since 2006).
4. **Mesonet (Synoptic Data)** — JSON feed adding stations in the Pacific Northwest, Hawaii, Alaska, and miscellaneous locations (Python, since 2020).

The gleaners write to a local MySQL database (for the at-home original site) and post to cloud backends:

- A **Cloudflare Worker** that inserts records into a D1 database.
- **Google Apps Scripts** that append rows to Google Sheets (two sheets for the Python gleaners, two for the Perl gleaners).

## History

For nearly 20 years Waconia was hosted by PNNL and later by Gustavus Adolphus College, running as a classic ASP application on IIS with a server-side database. The original ASP site still runs on my home network. The new browser-based client, backed by cloud storage, is a way to share Waconia publicly without the cost of hosting a server-side application.
