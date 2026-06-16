# Kairos Redeemer - Vertical Slice Spec

## Scope

This vertical slice covers the first complete playable arc:

1. Beth-Tikvah
2. Lamp fracture sequence
3. Threshold of Testimony
4. Garden of First Light
5. Briar Bridegroom chapter boss
6. one early Meridian witness moment or teaser

The vertical slice exists to prove:

- exploration feel
- dialogue and presentation tone
- combat loop
- Lie / Truth readability
- early party identity
- chapter-end restoration payoff

## 1. Slice Goals

### Player-facing goals
- understand the spiritual stakes quickly
- care about Elior's home and calling
- learn core exploration and battle controls
- experience one complete chapter arc
- defeat one thematic boss through both tactics and truth

### Team-facing goals
- validate visual style
- validate map scale
- validate event pipeline
- validate battle UI for statuses, Lies, and Assurance
- validate music and tone in sacred vs ordinary scenes

## 2. Playtime Target

- First-run slice target: 75-120 minutes
- Expert replay target: 45-60 minutes

## 3. Playable Characters

### Elior
Role: balanced support striker and truth-breaker

Required implementation:
- basic attack
- Seed Slash
- Shepherd Guard
- Discern Lies
- Beloved Seal

### Junia
Role: fast support and song caster

Required implementation:
- basic attack
- Psalm Rush
- Festival Cry
- Song of Release

### Micah
Role: anti-illusion utility and reveal specialist

Required implementation:
- basic attack
- Veil Pierce
- Watchman's Cry
- True Sight

### Synergy Techs required for slice
- Elior + Junia: Psalm of First Light
- Elior + Micah: Serpent Breaker

## 4. Slice Story Beats

### 4.1 Beth-Tikvah Intro
Purpose:
- teach movement and interaction
- establish community warmth
- introduce belovedness language

Required scenes:
- opening blessing
- festival setup
- Junia's performance
- optional NPC dialogue about harvest, prayer, and daily life

### 4.2 Lamp Fracture
Purpose:
- inciting incident
- show Rift Herald
- set tone for the whole project

Required scenes:
- Elior approaches Lamp Pavilion
- relic reacts
- sky fracture and serpent vision
- Junia endangered
- transition to Threshold

### 4.3 Threshold of Testimony
Purpose:
- teach hub logic
- introduce Keeper and Micah
- give first mission

Required scenes:
- player wakes in threshold chamber
- conversation with Keeper
- explanation of wounded ages
- first use of codex or journal update

### 4.4 Garden of First Light
Purpose:
- deliver first full chapter gameplay loop
- introduce distorted love theme
- escalate from field enemies to chapter boss

Required beats:
- arrive in garden edge
- observe NPCs and environmental distortion
- learn Veiled World teaser
- dungeon route to Tree of First Light
- Briar Bridegroom confrontation
- restoration cutscene

## 5. Level Breakdown

## 5.1 Beth-Tikvah

### Map intent
Compact but alive introductory town.

### Required sub-areas
- Feast Square
- Elior's home lane
- Lamp Pavilion
- Pilgrim Gate

### Core interactions
- talk to townsfolk
- optional prayer point
- purchase or receive starter item
- trigger main festival cutscene

### Tutorial coverage
- movement
- interact
- quest marker
- journal

## 5.2 Threshold of Testimony

### Map intent
Small sacred hub with strange calm.

### Required sub-areas
- arrival platform
- Keeper's cloister
- witness pool
- first gate dais

### Core interactions
- meet Keeper
- recruit Micah
- unlock first gate
- inspect lore objects for cosmology hints

### Tutorial coverage
- party menu
- codex unlock
- save point

## 5.3 Garden of First Light

### Map intent
Beautiful, luminous, slightly oppressive.

### Required sub-areas
- Garden Edge
- Whispering Grove
- Thorn Verge
- Tree of First Light approach
- Boss arena

### Visual rules
- color palette: vibrant greens, gold light, and invasive thorns
- threat is emotional and invasive, not grimdark

### Core interactions
- first field encounters
- inspect possessed / fearful NPC pairs
- one environmental puzzle using Junia resonance or Micah reveal
- one Veiled World glimpse showing constricting thorn-spirits

### Tutorial coverage
- visible encounter start
- ATB battle
- SP and Tech use
- Assurance meter
- Lie indicator
- Synergy Tech unlock

## 6. Encounter Plan

## 6.1 Field Enemy Families

### Clinging Vines
- low HP
- attempts bind / root
- teaches anti-control timing

### Thorn Hounds
- rush attackers
- punish slow play

### False Blossoms
- disguise enemy buffs as healing petals
- Micah reveal teaches discernment

### Possessive Keepers
- humanoid elite
- applies early lie-like debuff around control and fear of loss

## 6.2 Combat Teaching Sequence

### Encounter 1
- one enemy type only
- teach Attack and Tech

### Encounter 2
- adds enemy speed pressure
- teach Defend and timing

### Encounter 3
- first false-buff or reveal mechanic
- teach Micah utility

### Encounter 4
- scripted mini-elite
- teach Lie warning and Song of Release

## 7. First Lie Tutorial

### Tutorial Lie
Name: "If You Release, You Lose"

Effects:
- target resists switching or guarding others
- reduced willingness of support UI prompt
- light Clarity penalty

Counter routes:
- Elior: Beloved Seal
- Junia: Song of Release
- Micah: Veil Pierce on source bloom
- Pray while standing near truth-root node

Goal:
Show that spiritual pressure changes combat logic and can be broken.

## 8. Boss Spec - Briar Bridegroom

## 8.1 Narrative Role
First chapter boss and first full expression of the game's distortion model.

### Theme
Possessive love

### Dominant Lie
"If you love, seize."

### Emotional read
Beautiful, persuasive, controlling, tragic rather than merely monstrous.

## 8.2 Arena

Location: Tree of First Light

Arena features:
- central rooted trunk
- two blossom pylons
- one truth-root node that can be activated once per phase
- changing vine walls

## 8.3 Boss Phases

### Phase 1 - Enchantment
Moves:
- Thorn Embrace: bind one ally
- Blossom Oath: self-buff disguised as blessing
- Clutch of Devotion: marks one ally, extra damage if party focuses elsewhere

Player lesson:
- use Micah to reveal false blessing
- use Junia to cleanse bind

### Phase 2 - Possession
Trigger: 70% HP

Moves:
- Never Leave Me: Lie application to full party
- Thorn Court: arena control vines
- Jealous Bloom: counters support actions unless Lie pressure is broken

Player lesson:
- identify Lie and use truth actions, not only damage

### Phase 3 - False Union
Trigger: after first Lie break or below 35% HP

Moves:
- Take Into Yourself: attempts to absorb one blossom pylon for shield
- Garden Closed: increased aggression
- Grasping Heart: heavy single-target strike on Elior

Player lesson:
- use Synergy Techs to break shield and finish

## 8.4 Truth Counter Design

Valid counters:
- Elior Beloved Seal
- Junia Song of Release
- Micah Veil Pierce on blossom pylon
- Psalm of First Light Synergy Tech
- prayer interaction with truth-root node

Break payoff:
- blossom shield shatters
- boss loses counter stance
- arena brightens briefly

## 8.5 Victory Scene

The boss collapses into loosened vines and light.
Elior refuses to take the Fruit by force.
Love is restored through release rather than possession.

Reward outputs:
- Fruit of Love unlocked
- chapter clear
- new codex entries
- new gate at Threshold

## 9. UI and Tutorial Requirements

## 9.1 Required UI elements
- HP / SP bars
- ATB gauges
- Assurance meter
- active Lie display
- Synergy readiness marker
- combat log or floating callouts for truth-break progress

## 9.2 Tutorial popups needed
- movement and camera
- interaction and journal
- battle basics
- SP and Techs
- Pray command
- Assurance
- Lies and Truth counters
- Synergy Techs

## 10. Art Deliverables

## 10.1 Characters
- Elior battle and field rigs
- Junia battle and field rigs
- Micah battle and field rigs
- Keeper portrait and field model
- Briar Bridegroom boss model
- 4-5 enemy type models
- Beth-Tikvah NPC set
- Garden NPC set

## 10.2 Environments
- Beth-Tikvah intro town set
- Lamp Pavilion setpiece
- Threshold of Testimony set
- Garden field set
- Tree of First Light boss arena

## 10.3 VFX
- Lamp fracture
- threshold portal
- Junia hymn resonance
- Micah reveal pulse
- Elior beloved shield
- lie application and lie break
- Fruit restoration

## 11. Audio Deliverables

Required tracks:
- Beth-Tikvah town theme
- festival variation
- fracture cue
- Threshold theme
- Garden field theme
- battle theme
- boss theme
- restoration cue

Required SFX:
- relic hum
- time rupture
- thorn bind
- reveal pulse
- prayer chime
- truth break

## 12. Narrative Script Requirements

Needed script assets:
- opening town dialogue set
- Lamp fracture cinematic dialogue
- Keeper introduction scene
- Garden NPC dialogue variants
- Briar Bridegroom confrontation
- post-boss restoration scene

Mandatory lines to preserve:
- blessing language around belovedness
- Keeper's framing that the Serpent distorts belonging
- first Christological contrast: the first Adam grasped, the Beloved Son receives and gives

## 13. Engineering Requirements

Minimum systems for slice:
- exploration controller
- dialogue/cutscene runner
- field enemy trigger
- battle scene loading
- ATB battle loop
- status system
- Lie / Truth tagging and break logic
- Synergy Tech support
- save/load
- codex / journal unlock
- map state swap after chapter completion

## 14. QA Acceptance Criteria

The slice is acceptable when:

1. it can be completed from start to chapter clear without debug tools
2. players understand the basic mission by the time they leave Threshold
3. players can identify that the Garden chapter is about distorted love
4. at least two distinct Truth counter routes feel viable against the boss
5. Briar Bridegroom can be defeated by an average player without grinding
6. restoration payoff feels emotionally distinct from simple victory
7. save/load works before and after boss completion
8. tone remains reverent in sacred scenes and warm in Beth-Tikvah

## 15. Slice Exit Decision Questions

After the vertical slice, the team should explicitly answer:

1. Does the Christ-centered identity framework feel integrated rather than appended?
2. Is the Lie / Truth system understandable and fun?
3. Is the chapter scope sustainable across the full game?
4. Does the combat depth justify a 30-40 hour campaign?
5. Are Meridian scenes tonally successful?
6. Is the chosen visual style strong enough for both ordinary towns and sacred cosmology?
