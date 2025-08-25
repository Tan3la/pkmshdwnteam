document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const teamsGrid = document.getElementById('teams-grid');
    const addTeamForm = document.getElementById('add-team-form');
    const modal = document.getElementById('team-modal');
    const closeModalBtn = document.querySelector('.close-button');
    const modalContent = document.getElementById('modal-team-details');
    const searchBar = document.getElementById('search-bar');
    const themeSwitcher = document.getElementById('theme-switcher');
    const backToTopBtn = document.getElementById('back-to-top');

    // Add Team Form specific elements
    const teamNameInput = document.getElementById('team-name');
    const teamCodeTextarea = document.getElementById('team-code');
    const teamInstructionsTextarea = document.getElementById('team-instructions');
    const teamNameError = document.getElementById('team-name-error');
    const teamCodeError = document.getElementById('team-code-error');
    const teamPreview = document.getElementById('team-preview');
    const pokemonPreviewSprites = teamPreview.querySelector('.pokemon-preview-sprites');
    const teamPreviewError = document.getElementById('team-preview-error');
    const formStatusMessage = document.getElementById('form-status-message');

    // --- State ---
    let focusedElementBeforeModal;

    // --- Classes ---
    const teamsManager = new Teams();

    // --- Theme Management ---
    const currentTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);

    themeSwitcher.addEventListener('click', () => {
        let theme = document.documentElement.getAttribute('data-theme');
        if (theme === 'dark') {
            theme = 'light';
        } else {
            theme = 'dark';
        }
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    });

    // --- Utility Functions ---
    function debounce(func, delay) {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), delay);
        };
    }

    function escapeHTML(str) {
        const p = document.createElement('p');
        p.textContent = str;
        return p.innerHTML;
    }

    function showMessage(element, message, type) {
        element.textContent = message;
        element.className = `form-status-message ${type}`;
        element.setAttribute('role', 'status');
        setTimeout(() => {
            element.textContent = '';
            element.className = 'form-status-message';
            element.removeAttribute('role');
        }, 5000);
    }

    // --- Team Rendering Functions ---
    function renderTeams(filter = '') {
        teamsGrid.innerHTML = '';
        const allTeams = teamsManager.getTeams().filter(team =>
            team.name.toLowerCase().includes(filter.toLowerCase())
        );

        if (allTeams.length === 0) {
            teamsGrid.innerHTML = '<p class="no-teams-message">No teams found. Try adding one!</p>';
            return;
        }

        const fragment = document.createDocumentFragment();
        allTeams.forEach(team => {
            const teamCard = createTeamCard(team);
            fragment.appendChild(teamCard);
        });
        teamsGrid.appendChild(fragment);
    }

    const debouncedRenderTeams = debounce(renderTeams, 300);

    function createTeamCard(team) {
        const teamCard = document.createElement('div');
        teamCard.className = 'team-card';
        teamCard.dataset.teamId = team.id;
        teamCard.setAttribute('role', 'button');
        teamCard.setAttribute('tabindex', '0');
        teamCard.setAttribute('aria-labelledby', `team-name-${team.id}`);

        teamCard.innerHTML = `
            <div class="team-card-header">
                <h3 id="team-name-${team.id}">${escapeHTML(team.name)}</h3>
                ${team.id.startsWith('user-') ? 
                    `<button class="delete-team-button" title="Delete Team" aria-label="Delete ${escapeHTML(team.name)}"><i class="fas fa-trash-alt" aria-hidden="true"></i></button>` : ''}
            </div>
            <div class="pokemon-sprites"></div>
        `;

        // Add sprites
        const pokemonSpritesContainer = teamCard.querySelector('.pokemon-sprites');
        const pokemonNames = teamsManager.parsePokemonNames(team.code);
        pokemonNames.slice(0, 6).forEach(pokemonName => {
            Pokemon.getPokemonData(pokemonName).then(data => {
                const spriteUrl = data?.sprites?.front_default || Pokemon.MISSING_NO_SPRITE; // Use fallback
                const spriteImg = document.createElement('img');
                spriteImg.src = spriteUrl;
                spriteImg.alt = pokemonName;
                spriteImg.title = pokemonName;
                spriteImg.loading = 'lazy'; // Lazy loading for images
                pokemonSpritesContainer.appendChild(spriteImg);
            });
        });

        // Add event listeners
        teamCard.addEventListener('click', () => openModalWithTeam(team));
        teamCard.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault(); // Prevent default spacebar action (scrolling)
                openModalWithTeam(team);
            }
        });

        if (team.id.startsWith('user-')) {
            teamCard.querySelector('.delete-team-button').addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm(`Are you sure you want to delete "${escapeHTML(team.name)}"?`)) {
                    teamsManager.deleteTeam(team.id);
                    renderTeams(searchBar.value);
                }
            });
        }

        return teamCard;
    }

    // --- Modal Functions ---
    async function openModalWithTeam(team) {
        focusedElementBeforeModal = document.activeElement;
        modal.style.display = 'block';
        modal.setAttribute('aria-hidden', 'false');
        modal.querySelector('.close-button').focus();
        document.body.style.overflow = 'hidden';

        modalContent.innerHTML = '<h2><i class="fas fa-spinner fa-spin"></i> Loading...</h2>';

        const pokemonData = Pokemon.parseExport(team.code);
        const pokemonDetailsPromises = pokemonData.map(p => Pokemon.getPokemonData(p.name));
        const pokemonApiData = await Promise.all(pokemonDetailsPromises);

        const pokemonDetailsHtml = pokemonData.map((p, index) => {
            const data = pokemonApiData[index];
            const sprite = data?.sprites?.front_default || Pokemon.MISSING_NO_SPRITE; // Use fallback
            return `
                <div class="pokemon-info-card">
                    <h4>
                        <img src="${sprite}" alt="${escapeHTML(p.name)}" loading="lazy">
                        ${escapeHTML(p.name)}
                    </h4>
                    <p><strong>Item:</strong> ${escapeHTML(p.item)}</p>
                    <p><strong>Ability:</strong> ${escapeHTML(p.ability)}</p>
                    <p><strong>Moves:</strong></p>
                    <ul>
                        ${p.moves.map(move => `<li>${escapeHTML(move)}</li>`).join('')}
                    </ul>
                </div>
            `;
        }).join('');

        modalContent.innerHTML = `
            <h2 id="modal-title">${escapeHTML(team.name)}</h2>
            <h3><i class="fas fa-info-circle"></i> Instructions</h3>
            <p>${team.instructions ? escapeHTML(team.instructions) : 'No instructions provided.'}</p>
            <h3><i class="fas fa-users"></i> Pokémon Details</h3>
            <div class="pokemon-details-grid">${pokemonDetailsHtml}</div>
            <h3><i class="fas fa-code"></i> Export Code</h3>
            <pre><code>${escapeHTML(team.code)}</code></pre>
            <button class="copy-code-button">Copy Code</button>
        `;

        modalContent.querySelector('.copy-code-button').addEventListener('click', (e) => {
            navigator.clipboard.writeText(team.code).then(() => {
                e.target.textContent = 'Copied!';
                setTimeout(() => {
                    e.target.textContent = 'Copy Code';
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy: ', err);
                alert('Failed to copy team code.');
            });
        });
    }

    function closeModal() {
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = 'auto';
        if (focusedElementBeforeModal) {
            focusedElementBeforeModal.focus();
        }
    }

    function trapFocus(e) {
        if (modal.style.display !== 'block') return;

        const focusableElements = modal.querySelectorAll(
            'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        const firstFocusableElement = focusableElements[0];
        const lastFocusableElement = focusableElements[focusableElements.length - 1];

        if (e.key === 'Tab') {
            if (e.shiftKey) {
                if (document.activeElement === firstFocusableElement) {
                    lastFocusableElement.focus();
                    e.preventDefault();
                }
            } else {
                if (document.activeElement === lastFocusableElement) {
                    firstFocusableElement.focus();
                    e.preventDefault();
                }
            }
        }
    }

    // --- Add Team Form Functions ---
    const debouncedUpdateTeamPreview = debounce(updateTeamPreview, 500);

    async function updateTeamPreview() {
        const teamCode = teamCodeTextarea.value.trim();
        pokemonPreviewSprites.innerHTML = '';
        teamPreviewError.textContent = '';

        if (teamCode.length === 0) {
            teamPreview.style.display = 'none';
            return;
        }

        teamPreview.style.display = 'block';
        const pokemonNames = teamsManager.parsePokemonNames(teamCode);

        if (pokemonNames.length === 0) {
            teamPreviewError.textContent = 'No valid Pokémon found in the provided code.';
            return;
        }

        const fragment = document.createDocumentFragment();
        for (const pokemonName of pokemonNames) {
            const data = await Pokemon.getPokemonData(pokemonName);
            const spriteUrl = data?.sprites?.front_default || Pokemon.MISSING_NO_SPRITE; // Use fallback
            const spriteImg = document.createElement('img');
            spriteImg.src = spriteUrl;
            spriteImg.alt = pokemonName;
            spriteImg.title = pokemonName;
            fragment.appendChild(spriteImg);
        }
        pokemonPreviewSprites.appendChild(fragment);
    }

    function validateForm() {
        let isValid = true;

        // Validate Team Name
        if (teamNameInput.value.trim() === '') {
            teamNameError.textContent = 'Team Name cannot be empty.';
            teamNameInput.setAttribute('aria-invalid', 'true');
            isValid = false;
        } else {
            teamNameError.textContent = '';
            teamNameInput.setAttribute('aria-invalid', 'false');
        }

        // Validate Team Code
        const parsedPokemon = teamsManager.parsePokemonNames(teamCodeTextarea.value.trim());
        if (teamCodeTextarea.value.trim() === '') {
            teamCodeError.textContent = 'Team Export Code cannot be empty.';
            teamCodeTextarea.setAttribute('aria-invalid', 'true');
            isValid = false;
        } else if (parsedPokemon.length === 0) {
            teamCodeError.textContent = 'No valid Pokémon found in the provided code. Please check the format.';
            teamCodeTextarea.setAttribute('aria-invalid', 'true');
            isValid = false;
        } else if (parsedPokemon.length > 6) {
            teamCodeError.textContent = `Too many Pokémon (${parsedPokemon.length}). A team can have at most 6 Pokémon.`;
            teamCodeTextarea.setAttribute('aria-invalid', 'true');
            isValid = false;
        } else {
            teamCodeError.textContent = '';
            teamCodeTextarea.setAttribute('aria-invalid', 'false');
        }

        return isValid;
    }

    // --- Event Listeners ---
    addTeamForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        formStatusMessage.textContent = ''; // Clear previous messages
        formStatusMessage.className = 'form-status-message';

        if (!validateForm()) {
            showMessage(formStatusMessage, 'Please correct the errors in the form.', 'error');
            return;
        }

        const teamName = teamNameInput.value.trim();
        const teamCode = teamCodeTextarea.value.trim();
        const teamInstructions = teamInstructionsTextarea.value.trim();

        try {
            teamsManager.addTeam(teamName, teamCode, teamInstructions);
            renderTeams();
            addTeamForm.reset();
            teamPreview.style.display = 'none'; // Hide preview after successful submission
            showMessage(formStatusMessage, 'Team added successfully!', 'success');
            document.getElementById('teams-section').scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            console.error('Error adding team:', error);
            showMessage(formStatusMessage, 'Failed to add team. Please try again.', 'error');
        }
    });

    teamCodeTextarea.addEventListener('input', debouncedUpdateTeamPreview);
    teamNameInput.addEventListener('input', () => {
        if (teamNameInput.value.trim() !== '') {
            teamNameError.textContent = '';
            teamNameInput.setAttribute('aria-invalid', 'false');
        }
    });

    searchBar.addEventListener('input', (e) => {
        debouncedRenderTeams(e.target.value);
    });

    closeModalBtn.addEventListener('click', closeModal);
    modal.addEventListener('keydown', trapFocus);
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });
    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && modal.style.display === 'block') {
            closeModal();
        }
    });

    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            backToTopBtn.classList.add('show');
        } else {
            backToTopBtn.classList.remove('show');
        }
    });

    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // --- Initial Render ---
    searchBar.value = '';
    renderTeams();
    teamPreview.style.display = 'none'; // Hide preview on initial load
});
