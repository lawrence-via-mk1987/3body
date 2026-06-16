# Kairos Redeemer - Combat Design Spec

## Document Purpose

This document defines the production-facing combat model for Kairos Redeemer. It translates the high-level JRPG concept into implementable rules, player-facing systems, tuning targets, and content authoring requirements.

## 1. Combat Vision

Combat should feel:

- readable
- rhythmic
- party-synergy-driven
- spiritually expressive
- boss-mechanic-rich
- fair, even when threatening

The player wins not by raw stat inflation alone, but by:

- identifying lies
- stabilizing Assurance
- timing Techs and Synergy Techs
- using Fruit passives well
- breaking enemy distortions with truth

## 2. Battle Format

- Active party size: 3
- Reserve party: available outside combat
- Encounter model: visible enemies on field
- Battle structure: ATB-inspired timeline system
- Battle modes: Wait default, Active optional
- Camera style: authored side-angle arena framing

## 3. Tuning Targets

### Standard encounter
- 20-60 seconds

### Elite encounter
- 60-120 seconds

### Miniboss
- 2-4 minutes

### Major story boss
- 6-12 minutes

## 4. Core Resources

### HP
Physical survival pool.

### SP
Spirit Points used for Techs.

### ATB
Character readiness resource that fills over time.

### Assurance
Shared party meter representing how grounded the team is in truth, hope, and identity in Christ.

### Lie Pressure
Encounter-side pressure value that tracks how aggressively a boss is enforcing distortion. Usually hidden, but may be surfaced in advanced fights.

## 5. Stats

### Primary stats
- Power
- Guard
- Spirit
- Speed

### Secondary spiritual stats
- Hope: resists despair
- Clarity: resists deception
- Resolve: resists temptation, forced actions, interruption
- Mercy: improves support potency and some nonlethal outcomes
- Witness: improves effectiveness against corrupt, demonic, and serpent enemies

## 6. Turn Flow

1. ATB fills based on Speed and current effects
2. Ready character receives command access
3. Player chooses Attack, Tech, Item, Defend, Pray, or Synergy
4. Action resolves according to timing and target state
5. Passives and on-hit effects resolve
6. Encounter state updates:
   - Lie Pressure changes
   - Assurance shifts
   - boss phase checks
   - break / stagger checks

## 7. Commands

### Attack
Basic weapon strike. Some weapons apply side bonuses:
- Elior: anti-deception scaling
- Micah: hidden-target reveal chance
- Mara: armor-piercing finesse

### Tech
Primary character abilities. Spend SP.

### Item
Consumables, relic charges, battle aids.

### Defend
- reduces incoming damage
- improves Resolve for one round
- may build character-specific effects

### Pray
Universal low-power command.

Baseline Pray effects:
- small Assurance gain
- small self-cleanse vs minor mental effects
- interacts with certain relics and passives

### Synergy
Dual Tech or Triple Tech when conditions are met.

## 8. Damage Types

### Standard
- Physical
- Fire
- Lightning
- Light
- Shadow

### Spiritual
- Accusation
- Deception
- Despair
- Domination
- Corruption
- Temptation

Spiritual types are especially important in boss content and should be surfaced clearly in UI once discovered.

## 9. Status Effects

### Common physical / elemental statuses
- Poison
- Burn
- Shock
- Slow
- Silence

### Spiritual statuses

#### Accused
- reduced healing received
- lowered Witness
- can snowball into stronger lie effects

#### Deceived
- false target indicators
- incorrect weakness display
- reduced Clarity

#### Despairing
- slower ATB
- reduced Assurance gain
- lower support output

#### Dominated
- forced target bias
- taunt-like loss of choice
- reduced Resolve

#### Corrupted
- stacking stat degradation
- weak to Goodness cleansing

#### Tempted
- boosts offense at hidden defensive cost
- may lock out Defend or Pray

## 10. Signature System: Lie / Truth

## 10.1 Design Goal

Lies are boss-level distortions that reframe combat, not just add a stat penalty.

They should:
- embody the chapter theme
- be readable
- feel spiritually meaningful
- offer multiple counterplay routes

## 10.2 Lie Structure

Each named Lie contains:
- id
- display name
- narrative text
- mechanical effect block
- counter tags
- break threshold
- backlash effect on break

### Example Lie template

| Field | Example |
| --- | --- |
| Name | You Are Not Beloved |
| Source | Nahash / Ancient Serpent |
| Effect | healing received -30%, Assurance gain halved, Elior target-priority lowered |
| Counter tags | beloved, witness, prophecy, no-condemnation |
| Break threshold | 3 Truth actions |
| Break effect | source stagger + backlash light damage |

## 10.3 Truth Sources

Truth actions can come from:
- character techs
- Pray
- Scripture relics
- Fruit activations
- environmental triggers
- companion-specific interactions

Truth is not one action type; it is a tagged system.

### Recommended truth tags
- beloved
- peace
- covenant
- no-condemnation
- witness
- mercy
- steadfastness
- worship

## 10.4 Lie Break Rules

When a valid Truth action hits an active Lie:

1. the Lie takes break progress
2. the boss may lose part of its aura or phase shield
3. feedback must be immediate and readable
4. when threshold is met, the Lie shatters
5. the boss becomes vulnerable or staggered

## 10.5 Authoring Rules

Every story boss must include:
- one major Lie
- at least two valid Truth routes
- at least one obvious visual tell
- one high-value payoff on break

## 11. Assurance System

## 11.1 Purpose

Assurance tracks whether the party is abiding in truth rather than unraveling under pressure.

It does not represent divine favor earned by performance.

## 11.2 Meter
- 0 to 5 segments

## 11.3 Gains
- Pray
- Selah songs
- Junia praise skills
- some Cassian and Tirzah support actions
- breaking Lies
- Mercy-themed actions

## 11.4 Losses
- taking spiritual damage
- failed lie checks
- despair spikes
- some boss phase transitions

## 11.5 Effects by state

### 0-1 segments
- high vulnerability to deception and accusation
- reduced healing efficiency

### 2-3 segments
- neutral baseline

### 4-5 segments
- improved Clarity
- increased support output
- stronger truth-break speed
- some abilities gain upgraded versions

## 12. Fruit System in Combat

Each restored Fruit unlocks one passive aura and one active benefit.

### Love
- passive: shared damage smoothing
- active: ally intercept effect

### Joy
- passive: despair resistance
- active: morale burst and cleanse

### Peace
- passive: reduced interruption
- active: calm field effect

### Patience
- passive: stronger charge / counter patterns
- active: delayed but amplified action

### Kindness
- passive: support efficiency
- active: mercy pulse, partial cleanse

### Goodness
- passive: corruption resistance
- active: holy strike bonus vs dark/corrupt targets

### Faithfulness
- passive: buffs last longer
- active: covenant anchor preventing dispel

### Gentleness
- passive: reduced collateral and beast hostility
- active: pacify / soften aggression

### Self-control
- passive: temptation resistance
- active: discipline stance preventing forced actions

### Full Fruit State
Unlocked late game.

Activation conditions:
- all Fruits restored
- full Assurance
- major boss or scripted moment

Effects:
- strong lie resistance
- better ATB recovery
- synergy cost reduction
- radiant witness aura

## 13. Character Combat Roles

## Elior - Support Striker / Truth Breaker
- balanced attacker
- identity-tech specialist
- converts truth into boss vulnerability

Core role tags:
- beloved
- witness
- anti-deception

## Junia - Speed Support / Hymn Caster
- speed buffs
- party cleanse
- praise-based Assurance generation

Core role tags:
- worship
- joy
- tongues

## Micah - Anti-Illusion Controller
- reveal hidden mechanics
- dispel enemy false buffs
- identify enemy alignments

Core role tags:
- discernment
- exposure
- anti-stealth

## Cassian - Healer / Recovery Anchor
- direct heals
- revival
- despair cleansing

Core role tags:
- mercy
- restoration
- no-condemnation support

## Mara - Tactical Mage
- initiative manipulation
- precision strikes
- boss pattern disruption

Core role tags:
- wisdom
- control
- break timing

## Tirzah - Tank / Counter Support
- guarding
- delayed counters
- Faith-based sustain

Core role tags:
- steadfastness
- protection
- endurance

## Matthias - Utility / Combo Enabler
- seal-breaking
- reaction amplification
- synergy enhancement

Core role tags:
- interpretation
- unlock
- combo support

## Jonan - Scholar Caster
- weakness identification
- scripture-based offense
- knowledge utility

Core role tags:
- knowledge
- analysis
- anti-corruption

## Selah - Prophetic Debuff / Truth Chorus
- exposes hidden sins / vulnerabilities
- powerful anti-lie support
- morale and witness boosting

Core role tags:
- prophecy
- witness
- rupture falsehood

## Azarel - Burst Miracle Artillery
- high-impact spell damage
- some protective miracle effects
- best when supporting the weak, not dominating

Core role tags:
- miracles
- fire
- judgment / protection

## 14. Tech Progression Structure

Each character should ship with:
- 7 core Techs
- 1 ultimate upgrade from companion quest
- 4-6 Dual Tech pairings
- 2-4 Triple Tech eligibility intersections

## 15. Example Tech Lists

### Elior
- Seed Slash
- Shepherd Guard
- Discern Lies
- Fruit of Love
- Fruit of Peace
- Beloved Seal
- Crown of Witness

### Junia
- Psalm Rush
- Tongue of Fire
- Festival Cry
- Song of Release
- Many Waters
- Joyful Noise
- Bridesong Dawn

### Micah
- Veil Pierce
- Watchman's Cry
- Serpent Mark
- Night Patrol
- True Sight
- Discern Spirits
- Gate of Warning

## 16. Dual and Triple Tech Rules

## 16.1 Unlock Rules
Synergy Techs unlock via:
- chapter progression
- party combinations
- companion quests
- Spirit Board nodes

## 16.2 Cost Rules
Recommended:
- both/all participants spend reduced SP
- ATB readiness required for all participants
- some advanced techniques consume Assurance

## 16.3 Signature Synergies

### Dual Tech examples
- Elior + Micah: Serpent Breaker
- Elior + Cassian: Beloved Rest
- Mara + Jonan: Wisdom Scroll
- Selah + Matthias: True Interpretation

### Triple Tech examples
- Elior + Cassian + Selah: Beloved of God
- Elior + Micah + Azarel: Cast Down the Dragon
- Junia + Matthias + Selah: Tongue of Many Waters

## 17. Boss Design Framework

Every major boss spec should include:
- chapter context
- lie theme
- moveset
- phase transitions
- truth counter routes
- UI messaging needs
- defeat transformation outcome

### Example: Briar Bridegroom
- lie: "If you love, seize"
- mechanics:
  - charm / bind effects
  - ally tethering
  - rooted zones
  - escalation when player over-focuses one target
- truth counters:
  - Elior Beloved Seal
  - Junia Song of Release
  - Pray at the Tree of First Light node
  - Micah Veil Pierce on false blossom shields

## 18. Enemy AI Behavior Classes

### Striker
High damage, low defense

### Anchor
Protective enemy that carries aura or shield

### Controller
Applies status and movement pressure

### Liturgist
Builds lie pressure or casts layered buffs

### Summoner
Adds subordinate enemies

### Judge
Applies accusation, seals, punishments

### Beast
Simple but dangerous physical aggression

## 19. Difficulty and Accessibility Notes

Difficulty affects:
- damage
- boss timing
- SP economy
- lie pressure speed
- encounter density

Difficulty must not remove:
- Truth / Lie mechanics
- Assurance
- fruit interactions

Accessibility features must include:
- battle speed toggle
- reduced VFX intensity
- clear status icon glossary
- readable Lie popups
- tutorial recap panel

## 20. Data Requirements

Combat content should be data-driven. Each ability, Lie, status, and boss phase needs:

- unique id
- display name
- animation id
- cost
- target type
- effect formula
- tag list
- unlock conditions
- AI usability flags

## 21. Test Plan for Vertical Slice

Vertical slice combat validation should confirm:

1. ATB pacing feels responsive
2. Lie application is readable
3. Truth counters are understandable without spoilers
4. Assurance changes are visible and meaningful
5. Elior / Junia / Micah form a satisfying early-game triangle
6. Briar Bridegroom feels like a chapter-ending spike, not a wall
7. Prayer is useful but not dominant
8. Post-battle readability is strong enough to support later complexity

## 22. Deliverables Following This Spec

After approval, combat implementation should branch into:

- formulas sheet
- status matrix
- Tech database
- enemy data sheet
- boss encounter scripts
- battle UI wireframes
