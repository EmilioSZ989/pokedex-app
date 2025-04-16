document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  const searchButton = document.getElementById('searchButton');
  const pokemonSprite = document.getElementById('pokemonSprite');
  const pokemonNameDisplay = document.getElementById('pokemonName');
  const pokemonDescriptionDisplay = document.getElementById('pokemonDescription');
  const statsChartCanvas = document.getElementById('statsChart');
  const evolutionChainDisplay = document.getElementById('evolutionChainDisplay');
  const prevEvolutionButton = document.getElementById('prevEvolution');
  const nextEvolutionButton = document.getElementById('nextEvolution');
  let statsChart;
  let currentEvolutionChain = [];
  let currentEvolutionIndex = 0;
  let searchedPokemonName = ''; // Para recordar el Pokémon buscado

  searchButton.addEventListener('click', searchPokemon);
  searchInput.addEventListener('keypress', (event) => {
      if (event.key === 'Enter') {
          searchPokemon();
      }
  });

  prevEvolutionButton.addEventListener('click', showPrevEvolution);
  nextEvolutionButton.addEventListener('click', showNextEvolution);

  function updateEvolutionButtonsVisibility() {
      prevEvolutionButton.disabled = currentEvolutionIndex <= 0;
      nextEvolutionButton.disabled = currentEvolutionIndex >= currentEvolutionChain.length - 1;
  }

  function showPrevEvolution() {
      if (currentEvolutionIndex > 0) {
          currentEvolutionIndex--;
          displayCurrentEvolution();
      }
      updateEvolutionButtonsVisibility();
  }

  function showNextEvolution() {
      if (currentEvolutionIndex < currentEvolutionChain.length - 1) {
          currentEvolutionIndex++;
          displayCurrentEvolution();
      }
      updateEvolutionButtonsVisibility();
  }

  async function displayCurrentEvolution() {
      const pokemonName = currentEvolutionChain[currentEvolutionIndex];
      try {
          const pokemonData = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`);
          if (pokemonData.ok) {
              const data = await pokemonData.json();
              updatePokemonDisplay(data);
              const speciesRes = await fetch(data.species.url);
              const speciesData = await speciesRes.json();
              updatePokemonDescription(speciesData);
              const statsData = data.stats.map(s => s.base_stat);
              renderStatsChart(data.stats.map(stat => stat.stat.name), statsData);
          } else {
              console.warn(`No se pudieron obtener datos para ${pokemonName}.`);
          }
      } catch (error) {
          console.error(`Error al obtener datos para ${pokemonName}:`, error);
      }
      updateEvolutionButtonsVisibility();
  }

  async function searchPokemon() {
      const name = searchInput.value.toLowerCase().trim();
      if (!name) return;

      searchedPokemonName = name; // Guardar el nombre buscado
      try {
          const pokemonRes = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
          if (!pokemonRes.ok) {
              throw new Error(`No se encontró el Pokémon "${name}".`);
          }
          const pokemonData = await pokemonRes.json();

          updatePokemonDisplay(pokemonData);

          const speciesRes = await fetch(pokemonData.species.url);
          const speciesData = await speciesRes.json();
          updatePokemonDescription(speciesData);

          const statsData = pokemonData.stats.map(s => s.base_stat);
          renderStatsChart(pokemonData.stats.map(stat => stat.stat.name), statsData);

          await fetchEvolutionChain(speciesData.evolution_chain.url, name); // Pasar el nombre buscado

      } catch (error) {
          alert(error.message);
          resetPokemonDisplay();
      }
  }

  function updatePokemonDisplay(data) {
      pokemonSprite.src = data.sprites.front_default;
      pokemonSprite.alt = `Sprite de ${capitalize(data.name)}`;
      pokemonNameDisplay.textContent = capitalize(data.name);
  }

  function updatePokemonDescription(speciesData) {
      const entry = speciesData.flavor_text_entries.find(e => e.language.name === 'es');
      pokemonDescriptionDisplay.textContent = entry ? entry.flavor_text : 'Descripción no disponible.';
  }

  async function fetchEvolutionChain(url, searchedName) {
      try {
          const evolutionRes = await fetch(url);
          if (!evolutionRes.ok) {
              throw new Error('No se pudo cargar la cadena de evolución.');
          }
          const evolutionData = await evolutionRes.json();
          const evolutionList = await processEvolutionChain(evolutionData.chain);
          currentEvolutionChain = evolutionList;
          currentEvolutionIndex = currentEvolutionChain.indexOf(searchedName);
          if (currentEvolutionIndex === -1) {
              currentEvolutionIndex = 0; // Si no se encuentra, mostrar el inicio de la cadena
          }
          displayCurrentEvolution();
      } catch (error) {
          console.error('Error al cargar la cadena de evolución:', error);
          evolutionChainDisplay.innerHTML = '<p>Cadena de evolución no disponible.</p>';
          updateEvolutionButtonsVisibility();
      }
  }

  async function processEvolutionChain(chain) {
      const evolutionList = [];
      const queue = [chain];

      while (queue.length > 0) {
          const current = queue.shift();
          evolutionList.push(current.species.name);
          if (current.evolves_to && current.evolves_to.length > 0) {
              queue.push(current.evolves_to[0]);
          }
      }
      updateEvolutionButtonsVisibility();
      displayEvolutionChainImages(chain);
      return evolutionList;
  }

  async function displayEvolutionChainImages(chain) {
      evolutionChainDisplay.innerHTML = '';
      const queue = [chain];

      while (queue.length > 0) {
          const currentEvolution = queue.shift();
          const pokemonName = currentEvolution.species.name;

          try {
              const pokemonData = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`);
              if (pokemonData.ok) {
                  const data = await pokemonData.json();
                  const evolutionDiv = document.createElement('div');
                  evolutionDiv.classList.add('evolution-pokemon');
                  const img = document.createElement('img');
                  img.src = data.sprites.front_default;
                  img.alt = pokemonName;
                  const span = document.createElement('span');
                  span.textContent = capitalize(pokemonName);
                  evolutionDiv.appendChild(img);
                  evolutionDiv.appendChild(span);
                  evolutionChainDisplay.appendChild(evolutionDiv);

                  if (currentEvolution.evolves_to.length > 0) {
                      const arrow = document.createElement('span');
                      arrow.textContent = ' → ';
                      evolutionChainDisplay.appendChild(arrow);
                      queue.push(currentEvolution.evolves_to[0]);
                  }
              } else {
                  console.warn(`No se pudieron obtener datos para ${pokemonName}.`);
              }
          } catch (error) {
              console.error(`Error al obtener datos para ${pokemonName}:`, error);
          }
      }
  }


  function capitalize(str) {
      return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function resetPokemonDisplay() {
      pokemonSprite.src = '';
      pokemonSprite.alt = 'Sprite del Pokémon';
      pokemonNameDisplay.textContent = 'Nombre';
      pokemonDescriptionDisplay.textContent = 'Descripción';
      if (statsChart) {
          statsChart.destroy();
          statsChart = null;
      }
      evolutionChainDisplay.innerHTML = '';
      currentEvolutionChain = [];
      currentEvolutionIndex = 0;
      updateEvolutionButtonsVisibility();
  }

  function renderStatsChart(statLabels, stats) {
      const labels = statLabels.map(label => capitalize(label.replace('-', ' ')));
      const data = {
          labels: labels,
          datasets: [{
              label: 'Estadísticas Base',
              data: stats,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderColor: 'white',
              borderWidth: 2,
              pointBackgroundColor: 'white',
              pointBorderColor: '#fff',
              pointHoverBackgroundColor: '#fff',
              pointHoverBorderColor: 'white'
          }]
      };

      const options = {
          responsive: true,
          plugins: {
              legend: { display: false },
              tooltip: {
                  callbacks: {
                      label: function(context) {
                          return `${context.label}: ${context.formattedValue}`;
                      }
                  },
                  titleFont: {
                      family: "'Press Start 2P', cursive",
                      size: 12
                  },
                  bodyFont: {
                      family: "'Press Start 2P', cursive",
                      size: 10
                  }
              }
          },
          scales: {
              r: {
                  angleLines: { color: 'white' },
                  grid: { color: 'gray' },
                  pointLabels: {
                      color: 'white',
                      font: {
                          family: "'Press Start 2P', cursive",
                          size: 10
                      }
                  },
                  ticks: {
                      display: false,
                      max: Math.max(...stats) + 20,
                      stepSize: 50 // Puedes ajustar esto
                  }
              }
          }
      };

      const ctx = statsChartCanvas.getContext('2d');
      if (statsChart) {
          statsChart.destroy();
      }
      statsChart = new Chart(ctx, {
          type: 'radar',
          data: data,
          options: options
      });
  }
});