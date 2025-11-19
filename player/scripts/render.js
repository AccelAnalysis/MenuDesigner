export const render = (schedule) => {
  const root = document.getElementById('player-root');
  root.innerHTML = schedule.groups
    .map((group) => `<section class="slide">${group.name}</section>`)
    .join('');
};
