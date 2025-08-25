class Teams {
    constructor() {
        this.defaultTeams = [
            {
                id: 'default-1',
                name: 'Gen 9 OU Standard',
                code: `Glimmora @ Focus Sash
Ability: Toxic Debris
Tera Type: Ghost
EVs: 252 SpA / 4 SpD / 252 Spe
Timid Nature
- Mortal Spin
- Stealth Rock
- Power Gem
- Earth Power

Great Tusk @ Booster Energy
Ability: Protosynthesis
Tera Type: Ground
EVs: 252 Atk / 4 SpD / 252 Spe
Jolly Nature
- Headlong Rush
- Close Combat
- Ice Spinner
- Rapid Spin

Kingambit @ Leftovers
Ability: Supreme Overlord
Tera Type: Dark
EVs: 252 Atk / 4 SpD / 252 Spe
Jolly Nature
- Kowtow Cleave
- Sucker Punch
- Iron Head
- Swords Dance

Dragonite @ Heavy-Duty Boots
Ability: Multiscale
Tera Type: Normal
EVs: 252 Atk / 4 SpD / 252 Spe
Adamant Nature
- Extreme Speed
- Dragon Dance
- Earthquake
- Roost

Gholdengo @ Choice Scarf
Ability: Good as Gold
Tera Type: Steel
EVs: 252 SpA / 4 SpD / 252 Spe
Timid Nature
- Make It Rain
- Shadow Ball
- Focus Blast
- Trick

Cinderace @ Heavy-Duty Boots
Ability: Libero
Tera Type: Fire
EVs: 252 Atk / 4 SpD / 252 Spe
Jolly Nature
- Pyro Ball
- U-turn
- Court Change
- Sucker Punch`,
                instructions: 'A solid offensive team with hazard control and a powerful late-game sweeper. Glimmora sets up hazards, Great Tusk provides removal and offense, and Kingambit cleans up late-game.'
            },
            {
                id: 'default-2',
                name: 'Rain Offense',
                code: `Pelipper @ Damp Rock
Ability: Drizzle
Tera Type: Water
EVs: 248 HP / 252 Def / 8 SpD
Bold Nature
- Hurricane
- U-turn
- Roost
- Scald

Barraskewda @ Choice Band
Ability: Swift Swim
Tera Type: Water
EVs: 252 Atk / 4 SpD / 252 Spe
Adamant Nature
- Liquidation
- Close Combat
- Psychic Fangs
- Flip Turn

Zapdos @ Heavy-Duty Boots
Ability: Static
Tera Type: Electric
EVs: 252 SpA / 4 SpD / 252 Spe
Timid Nature
- Thunder
- Hurricane
- Volt Switch
- Roost

Ferrothorn @ Leftovers
Ability: Iron Barbs
Tera Type: Grass
EVs: 252 HP / 252 Def / 4 SpD
Impish Nature
- Spikes
- Leech Seed
- Knock Off
- Body Press

Thundurus-Therian @ Heavy-Duty Boots
Ability: Volt Absorb
Tera Type: Electric
EVs: 252 SpA / 4 SpD / 252 Spe
Timid Nature
- Nasty Plot
- Thunderbolt
- Focus Blast
- Grass Knot

Urshifu-Rapid-Strike @ Choice Band
Ability: Unseen Fist
Tera Type: Water
EVs: 252 Atk / 4 SpD / 252 Spe
Jolly Nature
- Surging Strikes
- Close Combat
- U-turn
- Aqua Jet`,
                instructions: 'Set up rain with Pelipper and sweep with Barraskewda\'s Swift Swim. Zapdos provides powerful special attacks that benefit from rain (100% accurate Thunder).'
            }
        ];
        this.userTeams = JSON.parse(localStorage.getItem('userTeams')) || [];
    }

    getTeams() {
        // Filter out any potentially undefined or malformed team objects
        return [...this.defaultTeams, ...this.userTeams].filter(team => team && typeof team.id !== 'undefined');
    }

    addTeam(name, code, instructions) {
        const newTeam = {
            id: `user-${new Date().getTime()}`,
            name,
            code,
            instructions
        };
        this.userTeams.push(newTeam);
        this.saveUserTeams();
    }

    deleteTeam(teamId) {
        this.userTeams = this.userTeams.filter(team => team.id !== teamId);
        this.saveUserTeams();
    }

    saveUserTeams() {
        localStorage.setItem('userTeams', JSON.stringify(this.userTeams));
    }

    parsePokemonNames(code) {
        const pokemonBlocks = code.trim().split('\n\n');
        return pokemonBlocks.map(block => {
            const nameLine = block.split('\n')[0];
            return nameLine.split(' @ ')[0].trim();
        });
    }
}