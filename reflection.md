# AI Usage Write-Up

## How did you break down the problem before prompting?

I have experience in building applications using AI coding tools like Claude Code. Hence I have my own harness, agent files, custom CLAUDE.md and an entire working knowledge base of markdown files. One such file is my AI Vibecoding Guide, which documents my entire workflow in building full stack applications. In accordance with that I identified the users, the main functional requirements, some nice to have features, a reference for inspiration and wrote the most important document of all, the Product Requirements Document (PRD). Only once I had read the PRD properly and approved it did I let it start building.

## What did the AI get wrong, and how did you fix it?

The biggest one was that it wrote code that passed every single test, and then the app broke the moment I actually opened it and logged in. All of its tests were checking the data going into the app and coming back out, and not one of them ever loaded a real page, so everything looked green while the thing was completely broken. It found the problem in about a minute once it stopped reading its own test results and actually looked at the app running. After that I stopped taking passing tests as proof that something worked.

Another one was that it picked a version of the framework from memory instead of checking what the current version actually was, and the one it picked had a known security hole in it. That only got caught because the installer happened to print a warning by itself. Now I do not trust any version number it writes down without checking it myself.

The smaller ones came up again and again. It writes something clever when a boring one line answer already exists, and it writes the same piece of code out fresh in a new place instead of noticing it had already written it four times somewhere else.

## What did you deliberately not delegate to AI, and why?

From my experience with using AI, its weaknesses typically lie in structural architectural decisions, feature requirements mapping and identification and above all, frontend design. I wanted the UI and the UX to be particularly good and so I based it off of an existing app I use and made decisions regarding the features that I wanted the app to have, the fonts, the colour palettes, the background and the overall design theme and language. I wrote this reflection myself, unaided, which felt like the one document it would be self-defeating to delegate.

## What would you do differently with more time?

Some problems I faced when implementing the app was creating more features as I went on and identify new things I'd like to incorporate. So if I had more time I would create an even more detailed and extensive PRD document and I would add the features I originally wanted and cut for time, chiefly relations between two databases by having linked properties. So that property X can be synced across Database 1 and Database 2 which both require property X. I also wanted task templates within each database.
