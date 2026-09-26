  const comparisonTable = document.querySelector('#all-flights-table');
  const tbody = comparisonTable.tBodies[0];
  const rows = [...tbody.rows];
  const resultCount = document.querySelector('.result-count');
  const emptyState = document.querySelector('.empty-state');
  const activeSummary = document.querySelector('.active-summary');
  const disclosureStatus = document.querySelector('.disclosure-status');
  const clearButton = document.querySelector('.clear-filters');
  const disclosure = document.querySelector('.filter-disclosure');
  const controls = {
    month: document.querySelector('#filter-month'),
    days: document.querySelector('#filter-days'),
    availability: document.querySelector('#filter-availability'),
    maxPrice: document.querySelector('#filter-max-price'),
    outbound: document.querySelector('#filter-outbound'),
    returnFlight: document.querySelector('#filter-return'),
    sort: document.querySelector('#sort-results')
  };
  const filterControls = [controls.month, controls.days, controls.availability, controls.maxPrice, controls.outbound, controls.returnFlight];
  rows.forEach((row, index) => {
    row.dataset.originalIndex = index;
    const indexCell = row.insertCell(0);
    indexCell.className = 'index-cell';
  });
  const cleanText = value => value.replace(/\s+/g, ' ').trim();
  const rowPrice = row => {
    const value = row.cells[4].querySelector('.ils');
    return value ? Number(value.textContent.replace(/\D/g, '')) : null;
  };
  const rowDate = row => {
    const dateMatch = cleanText(row.cells[2].innerText).match(/(\d{2})\/(\d{2})/);
    const yearMatch = cleanText(row.cells[1].innerText).match(/\d{4}/);
    if (!dateMatch || !yearMatch) return null;
    return Date.UTC(Number(yearMatch[0]), Number(dateMatch[2]) - 1, Number(dateMatch[1]));
  };
  const rowTime = (row, column) => {
    const match = cleanText(row.cells[column].innerText).match(/\b(\d{2}):(\d{2})\b/);
    return match ? Number(match[1]) * 60 + Number(match[2]) : null;
  };
  const compareNullable = (a, b, direction = 1) => {
    if (a === null && b === null) return 0;
    if (a === null) return 1;
    if (b === null) return -1;
    return (a - b) * direction;
  };

  [...new Set(rows.map(row => cleanText(row.cells[1].innerText)))].forEach(month => {
    const option = document.createElement('option');
    option.value = month;
    option.textContent = month;
    controls.month.appendChild(option);
  });

  const enhancedSelects = [];
  const closeAllSelects = except => enhancedSelects.forEach(item => {
    if (item.wrap !== except) item.close();
  });

  function enhanceSelect(select, index) {
    const wrap = select.closest('.select-wrap');
    const label = select.closest('.control').querySelector('label');
    const listId = `${select.id}-listbox`;
    const labelId = `${select.id}-label`;
    const valueId = `${select.id}-value`;
    label.id = labelId;
    select.classList.add('native-select');
    select.tabIndex = -1;
    select.setAttribute('aria-hidden', 'true');

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'select-trigger';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-controls', listId);
    trigger.setAttribute('aria-labelledby', `${labelId} ${valueId}`);
    const value = document.createElement('span');
    value.id = valueId;
    value.className = 'select-value';
    trigger.appendChild(value);

    const menu = document.createElement('div');
    menu.id = listId;
    menu.className = 'select-menu';
    menu.setAttribute('role', 'listbox');
    menu.setAttribute('aria-labelledby', labelId);
    menu.hidden = true;

    const optionButtons = [...select.options].map((option, optionIndex) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'select-option';
      button.setAttribute('role', 'option');
      button.dataset.optionIndex = optionIndex;
      button.textContent = option.textContent;
      button.tabIndex = -1;
      menu.appendChild(button);
      return button;
    });

    const sync = () => {
      value.textContent = select.options[select.selectedIndex].textContent;
      optionButtons.forEach((button, optionIndex) => {
        button.setAttribute('aria-selected', String(optionIndex === select.selectedIndex));
      });
    };
    const close = (restoreFocus = false) => {
      menu.hidden = true;
      wrap.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
      if (restoreFocus) trigger.focus();
    };
    const open = (focusOption = false) => {
      closeAllSelects(wrap);
      menu.hidden = false;
      wrap.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
      const selected = optionButtons[select.selectedIndex] || optionButtons[0];
      selected.scrollIntoView({ block:'nearest' });
      if (focusOption) selected.focus();
    };
    const choose = button => {
      select.selectedIndex = Number(button.dataset.optionIndex);
      sync();
      select.dispatchEvent(new Event('change', { bubbles:true }));
      close(true);
    };

    trigger.addEventListener('click', event => {
      event.stopPropagation();
      menu.hidden ? open() : close();
    });
    trigger.addEventListener('keydown', event => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        open(true);
      } else if (event.key === 'Escape') {
        close();
      }
    });
    menu.addEventListener('click', event => event.stopPropagation());
    menu.addEventListener('keydown', event => {
      const current = optionButtons.indexOf(document.activeElement);
      if (event.key === 'Escape') {
        event.preventDefault();
        close(true);
      } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        const direction = event.key === 'ArrowDown' ? 1 : -1;
        optionButtons[(current + direction + optionButtons.length) % optionButtons.length].focus();
      } else if (event.key === 'Home' || event.key === 'End') {
        event.preventDefault();
        optionButtons[event.key === 'Home' ? 0 : optionButtons.length - 1].focus();
      } else if ((event.key === 'Enter' || event.key === ' ') && current >= 0) {
        event.preventDefault();
        choose(optionButtons[current]);
      }
    });
    optionButtons.forEach(button => button.addEventListener('click', () => choose(button)));
    label.addEventListener('click', event => {
      event.preventDefault();
      trigger.focus();
    });
    select.addEventListener('change', sync);
    wrap.append(trigger, menu);
    enhancedSelects.push({ wrap, trigger, menu, sync, close });
    sync();
  }

  Object.values(controls).forEach(enhanceSelect);
  document.addEventListener('click', () => closeAllSelects());

  function sortRows() {
    const mode = controls.sort.value;
    rows.sort((a, b) => {
      if (mode === 'date-asc') return compareNullable(rowDate(a), rowDate(b)) || Number(a.dataset.originalIndex) - Number(b.dataset.originalIndex);
      if (mode === 'date-desc') return compareNullable(rowDate(a), rowDate(b), -1) || Number(a.dataset.originalIndex) - Number(b.dataset.originalIndex);
      if (mode === 'price-asc') return compareNullable(rowPrice(a), rowPrice(b));
      if (mode === 'price-desc') return compareNullable(rowPrice(a), rowPrice(b), -1);
      if (mode === 'outbound-asc') return compareNullable(rowTime(a, 6), rowTime(b, 6));
      if (mode === 'return-desc') return compareNullable(rowTime(a, 7), rowTime(b, 7), -1);
      return Number(a.dataset.originalIndex) - Number(b.dataset.originalIndex);
    });
    rows.forEach(row => tbody.appendChild(row));
  }

  function applyFilters() {
    sortRows();
    let visible = 0;
    rows.forEach(row => {
      const price = rowPrice(row);
      const outboundTime = rowTime(row, 6);
      const returnTime = rowTime(row, 7);
      const isAvailable = price !== null;
      const matches =
        (!controls.month.value || cleanText(row.cells[1].innerText) === controls.month.value) &&
        (!controls.days.value || cleanText(row.cells[3].innerText) === controls.days.value) &&
        (!controls.availability.value || (controls.availability.value === 'available' ? isAvailable : !isAvailable)) &&
        (!controls.maxPrice.value || (price !== null && price <= Number(controls.maxPrice.value))) &&
        (!controls.outbound.value || (outboundTime !== null && (controls.outbound.value === 'morning' ? outboundTime < 600 : outboundTime >= 720))) &&
        (!controls.returnFlight.value || (returnTime !== null && (controls.returnFlight.value === 'morning' ? returnTime < 720 : returnTime >= 1080)));
      row.hidden = !matches;
      if (matches) {
        visible += 1;
        row.cells[0].textContent = visible;
      }
    });
    emptyState.hidden = visible !== 0;
    resultCount.textContent = `${visible} מתוך ${rows.length} אפשרויות`;

    const active = filterControls.filter(select => select.value);
    const activeLabels = active.map(select => `${select.closest('.control').querySelector('label').textContent}: ${select.options[select.selectedIndex].textContent}`);
    activeSummary.textContent = active.length ? `${active.length} מסננים פעילים · ${activeLabels.join(' · ')}` : 'ללא מסננים פעילים';
    disclosureStatus.textContent = active.length ? `${active.length} מסננים` : 'ללא סינון';
    clearButton.disabled = active.length === 0 && controls.sort.value === 'date-asc';
    Object.values(controls).forEach(select => {
      const isDefaultSort = select === controls.sort && select.value === 'date-asc';
      select.closest('.control').classList.toggle('has-value', Boolean(select.value) && !isDefaultSort);
    });
    enhancedSelects.forEach(item => item.sync());
  }

  Object.values(controls).forEach(select => select.addEventListener('change', applyFilters));
  clearButton.addEventListener('click', () => {
    filterControls.forEach(select => { select.value = ''; });
    controls.sort.value = 'date-asc';
    applyFilters();
  });

  const mobileLayout = window.matchMedia('(max-width:760px)');
  const syncDisclosure = event => {
    if (event.matches) disclosure.removeAttribute('open');
    else disclosure.setAttribute('open', '');
  };
  syncDisclosure(mobileLayout);
  mobileLayout.addEventListener('change', syncDisclosure);
  applyFilters();
