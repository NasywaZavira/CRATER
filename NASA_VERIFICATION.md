# NASA archive, card sourcing and verification (2026-11-15)

**Important:** Historical data is not live monitoring. Solar event at Sol 3 afternoon is a deterministic game timeline mapping and **not** an actual forecast for Mars.

## NASA CCMC DONKI historical event

NASA DONKI event notification `20240511-AL-013` (`2024-05-11T04:07:00-SEP-001`) states STEREO A detected enhanced 13–100 MeV protons starting `2024-05-11T04:07Z`; related flare `2024-05-11T01:10:00-FLR-001`, X5.8. Source: https://kauai.ccmc.gsfc.nasa.gov/DONKI/view/Alert/30728/1 . NASA DONKI catalogue: https://api.nasa.gov/ . This event was detected by STEREO A, **not a measured radiation level at the CRATER game outpost on Mars**. In the game, this *historical archive example* maps to a simulated Sol 3 afternoon solar-particle disaster; penalties are game balance constants, not scientific dose values.

## Ten initially missing card URLs

| Card | Verified evidence link | Evidence |
|---|---|---|
| ops-power-saving | https://science.nasa.gov/blogs/insight/2022/10/25/nasa-insights-power-level-as-of-oct-22-2022/ | InSight seismometer switched off to conserve energy in 2022, then resumed data collection |
| ops-plan-meals | https://www.nasa.gov/wp-content/uploads/2019/04/veggie_fact_sheet_508.pdf | NASA Veggie fact sheet: Aug 10, 2015 red romaine harvest and consumption |
| con-solar-array | https://www.nasa.gov/missions/insight/nasa-retires-insight-mars-lander-mission-after-years-of-science/ | InSight powered by dusty solar panels; operated more than four years; Dec 21, 2022 mission end |
| con-regolith-shield | https://pubmed.ncbi.nlm.nih.gov/24324275/ | Hassler surface radiation paper, DOI `10.1126/science.1244797` |
| fix-water-pump | https://www.nasa.gov/missions/station/iss-research/nasa-achieves-water-recovery-milestone-on-international-space-station/ | 98% water recovery milestone and about 1 gallon per crew member per day |
| fix-dust-panels | https://www.jpl.nasa.gov/news/nasas-insight-mars-lander-gets-a-power-boost/ | InSight scoop-trickled sand to clear some panel dust, June 3, 2021 |
| fix-shield-patch | https://www.jpl.nasa.gov/news/nasa-watches-mars-light-up-during-epic-solar-storm/ | Direct NASA/JPL evidence of a temporary radiation surge measured at Mars in May 2024 |
| res-oxygen-test | https://www.nasa.gov/solar-system/nasas-oxygen-generating-experiment-moxie-completes-mars-mission/ | MOXIE completion: 122g oxygen, Sept 6, 2023 |
| res-solar-storm | https://www.jpl.nasa.gov/news/nasa-watches-mars-light-up-during-epic-solar-storm/ | May 2024 Mars solar storm, NASA said ~30 chest X-rays equivalent |
| res-dust-storm | https://www.nasa.gov/news-release/nasas-record-setting-opportunity-rover-mission-on-mars-comes-to-end/ | Opportunity mission ended Feb 13, 2019 after 2018 planetwide dust storm |

## Fact checking numbers and publication years

- **0.67 mSv/day:** NASA news release of Dec 9, 2013 explicitly reports average 0.67 mSv/day for Curiosity surface Aug 2012–June 2013. Source: https://www.nasa.gov/news-release/nasa-rover-results-include-first-age-measurement-on-mars-and-help-for-human-exploration/ . This measurement period did not include a major solar storm; do not generalize it to constant radiation exposure on Mars.
- **Hassler et al. DOI `10.1126/science.1244797`:** online released Dec 9, 2013, published in **Science 343 on Jan 24, 2014**. Source: https://pubmed.ncbi.nlm.nih.gov/24324275/ . Metadata `sourceName` distinguishes both years.
- **May 2024 storm:** NASA JPL source reports RAD exposure 8,100 micrograys equivalent to ~30 chest X-rays, but that is **not** the 0.67 mSv/day 2012–2013 background value: https://www.jpl.nasa.gov/news/nasa-watches-mars-light-up-during-epic-solar-storm/ .
- **MOXIE:** NASA states total 122 grams of oxygen: https://www.nasa.gov/solar-system/nasas-oxygen-generating-experiment-moxie-completes-mars-mission/ .
- **NASA Veggie:** red romaine lettuce eaten Aug 10, 2015: https://www.nasa.gov/wp-content/uploads/2019/04/veggie_fact_sheet_508.pdf .
- **Chile peppers:** NASA describes ~2-week delayed growth in space; first harvest Oct 29, 2021: https://www.nasa.gov/missions/station/nasas-second-pepper-harvest-sets-record-on-space-station/ .
- **Kilopower:** NASA document describes 1–10 kW, continuous >=10 years, four units for outpost: https://www.nasa.gov/news-release/demonstration-proves-nuclear-fission-system-can-provide-space-exploration-power/ .
- **Radishes:** NASA release confirms 27 days maturity, >180 habitat sensors, red/blue/green/white LEDs: https://www.nasa.gov/missions/station/astronauts-harvest-radish-crop-on-international-space-station/ .
- **Phoenix:** NASA confirmed perchlorates in northern plains soil: https://science.nasa.gov/mission/mars-phoenix/ .

**Editorial note:** `fix-shield-patch` preserves the original card text while linking directly to NASA JPL's May 2024 report on a radiation surge measured by Curiosity, rather than attributing a storm-spike observation to the broader Hassler surface-radiation paper. `con-regolith-shield` still cites the Hassler paper for the 0.67 mSv/day baseline measurement.

Each card's source URL is displayed through the UI after selection. Independently re-check availability before submission; URLs are historical references, not a live NASA data feed.
