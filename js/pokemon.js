class Pokemon {
    static cache = {};
    static MISSING_NO_SPRITE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png'; // A common placeholder for missingno or similar

    static async getPokemonData(pokemonName) {
        // First, normalize the name for the API call: lowercase, replace spaces with hyphens, remove non-alphanumeric except hyphens
        let name = pokemonName.toLowerCase();
        name = name.replace(/ /g, '-'); // Replace spaces with hyphens
        name = name.replace(/[^a-z0-9-]/g, ''); // Remove any other non-alphanumeric characters except hyphens

        // Check if data is in cache
        if (Pokemon.cache[name]) {
            return Pokemon.cache[name];
        }

        try {
            const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
            if (!response.ok) {
                // If not found, return a specific error or null, and let the caller handle the fallback sprite
                throw new Error(`Could not fetch data for ${pokemonName} (normalized: ${name})`);
            }
            const data = await response.json();
            Pokemon.cache[name] = data; // Store data in cache
            return data;
        } catch (error) {
            console.error(error);
            // Return null so main.js can use the fallback sprite
            return null;
        }
    }

    static parseExport(teamCode) {
        const pokemonBlocks = teamCode.trim().split('\n\n');
        return pokemonBlocks.map(block => {
            const lines = block.split('\n');
            const nameLine = lines[0];
            const name = nameLine.split(' @ ')[0].trim();
            const item = nameLine.split(' @ ')[1]?.trim() || 'None';

            const abilityLine = lines.find(l => l.startsWith('Ability:'));
            const ability = abilityLine ? abilityLine.replace('Ability: ', '').trim() : 'Unknown';

            const moves = lines.filter(l => l.startsWith('- ')).map(l => l.replace('- ', '').trim());

            return { name, item, ability, moves };
        });
    }
}
