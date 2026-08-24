const tabs = Array.from(document.querySelectorAll('.tab'));
const filterButton = document.getElementById('filterButton');
const filterPanel = document.getElementById('filterPanel');
const panelCloseButton = document.getElementById('panelCloseButton');
const forSaleChip = document.getElementById('forSaleChip');
const removeChipButton = document.getElementById('removeChipButton');

function setActiveTab(targetTab) {
  tabs.forEach((tab) => {
    const isActive = tab === targetTab;
    tab.classList.toggle('is-active', isActive);
    tab.setAttribute('aria-selected', String(isActive));
  });
}

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    setActiveTab(tab);
  });
});

function closeFilterPanel() {
  if (!filterPanel || !filterButton) {
    return;
  }

  filterPanel.hidden = true;
  filterButton.setAttribute('aria-expanded', 'false');
}

function openFilterPanel() {
  if (!filterPanel || !filterButton) {
    return;
  }

  filterPanel.hidden = false;
  filterButton.setAttribute('aria-expanded', 'true');
}

if (filterButton && filterPanel) {
  filterButton.addEventListener('click', () => {
    const isOpen = !filterPanel.hidden;
    if (isOpen) {
      closeFilterPanel();
    } else {
      openFilterPanel();
    }
  });
}

if (panelCloseButton) {
  panelCloseButton.addEventListener('click', () => {
    closeFilterPanel();
    filterButton?.focus();
  });
}

document.addEventListener('click', (event) => {
  if (!filterPanel || !filterButton || filterPanel.hidden) {
    return;
  }

  const target = event.target;
  if (!(target instanceof Node)) {
    return;
  }

  const clickedInsidePanel = filterPanel.contains(target);
  const clickedButton = filterButton.contains(target);

  if (!clickedInsidePanel && !clickedButton) {
    closeFilterPanel();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeFilterPanel();
    filterButton?.focus();
  }
});

if (removeChipButton && forSaleChip) {
  removeChipButton.addEventListener('click', () => {
    forSaleChip.remove();
  });
}
