const numberILS = new Intl.NumberFormat('he-IL');

function hotelDate(isoDate) {
  const date = new Date(`${isoDate}T00:00:00Z`);
  return `${date.getUTCDate()}/${date.getUTCMonth() + 1}`;
}

function addCell(row, className, content) {
  const cell = document.createElement('td');
  if (className) cell.className = className;
  if (content instanceof Node) cell.append(content);
  else cell.textContent = content;
  row.append(cell);
  return cell;
}

function addCheckCell(row, accessibleText) {
  const cell = document.createElement('td');
  cell.className = 'hotel-condition';
  const check = document.createElement('span');
  check.className = 'hotel-check';
  check.setAttribute('aria-hidden', 'true');
  check.textContent = '✓';
  const label = document.createElement('span');
  label.className = 'sr-only';
  label.textContent = accessibleText;
  cell.append(check, label);
  row.append(cell);
}

async function loadHotels() {
  const body = document.getElementById('hotel-table-body');
  if (!body) return;

  try {
    const response = await fetch('../data/hotels.json', { cache: 'no-cache' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    let index = 0;

    data.destinations.forEach((destination) => {
      destination.hotels.forEach((hotel) => {
        index += 1;
        const row = document.createElement('tr');
        if (hotel.rating >= 9) row.classList.add('highly-rated-hotel');

        addCell(row, 'hotel-number', String(index));

        const hotelCell = document.createElement('td');
        hotelCell.className = 'hotel-name-cell';
        const destinationLabel = document.createElement('span');
        destinationLabel.className = 'hotel-destination';
        destinationLabel.textContent = destination.name;
        const link = document.createElement('a');
        link.className = 'hotel-link';
        link.href = hotel.bookingUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = hotel.name;
        link.setAttribute('aria-label', `${hotel.name} ב־${destination.name}, נפתח ב־Booking בחלונית חדשה`);
        hotelCell.append(destinationLabel, link);
        row.append(hotelCell);

        const dateRange = document.createElement('bdi');
        dateRange.dir = 'ltr';
        dateRange.textContent = `${hotelDate(destination.arrival)}–${hotelDate(destination.departure)}`;
        addCell(row, 'hotel-dates', dateRange);

        const score = document.createElement('span');
        score.className = 'hotel-rating';
        score.setAttribute('aria-label', `דירוג ${hotel.rating} מתוך 10`);
        score.textContent = hotel.rating.toFixed(1);
        const reviewCount = document.createElement('small');
        reviewCount.className = 'hotel-reviews';
        reviewCount.textContent = `${numberILS.format(hotel.reviewCount)} חוות דעת`;
        const scoreCell = addCell(row, 'hotel-rating-cell', score);
        scoreCell.append(reviewCount);

        const distance = document.createElement('bdi');
        distance.dir = 'ltr';
        distance.textContent = new Intl.NumberFormat('he-IL', { maximumFractionDigits: 2 }).format(hotel.distanceFromCenterKm);
        const distanceCell = addCell(row, 'hotel-distance', distance);
        distanceCell.append(' ק״מ');

        addCheckCell(row, 'ארוחת בוקר כלולה בתעריף');
        addCheckCell(row, 'ביטול חינם בתעריף המוצג');

        const nightlyPrice = document.createElement('bdi');
        nightlyPrice.dir = 'rtl';
        nightlyPrice.className = 'hotel-price';
        nightlyPrice.textContent = `${numberILS.format(Math.round(hotel.priceForTwoILS / destination.nights))} ₪`;
        const nightlyCell = addCell(row, 'hotel-price-cell', nightlyPrice);
        const nightlyUnit = document.createElement('small');
        nightlyUnit.className = 'hotel-reviews';
        nightlyUnit.textContent = 'לזוג ללילה';
        nightlyCell.append(nightlyUnit);

        const price = document.createElement('bdi');
        price.dir = 'rtl';
        price.className = 'hotel-price';
        price.textContent = `${numberILS.format(hotel.priceForTwoILS)} ₪`;
        const priceCell = addCell(row, 'hotel-price-cell', price);
        const duration = document.createElement('small');
        duration.className = 'hotel-reviews';
        duration.textContent = `${destination.nights} לילות · לזוג`;
        priceCell.append(duration);

        body.append(row);
      });
    });

    const checkedAt = document.getElementById('hotels-checked-at');
    if (checkedAt) checkedAt.textContent = hotelDate(data.checkedAt);
    const dateRangeHeading = document.getElementById('hotel-date-range');
    if (dateRangeHeading && data.destinations.length) {
      const firstArrival = data.destinations.reduce((earliest, destination) => destination.arrival < earliest ? destination.arrival : earliest, data.destinations[0].arrival);
      const lastDeparture = data.destinations.reduce((latest, destination) => destination.departure > latest ? destination.departure : latest, data.destinations[0].departure);
      dateRangeHeading.textContent = `אפשרויות לינה · ${hotelDate(firstArrival)}–${hotelDate(lastDeparture)}`;
    }
    const count = document.getElementById('hotel-count');
    if (count) count.textContent = `${index} אפשרויות`;
  } catch (error) {
    console.error('Unable to load hotel data', error);
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 9;
    cell.className = 'hotel-load-error';
    cell.textContent = 'לא הצלחנו לטעון את המלונות כרגע. כדאי לרענן את העמוד.';
    row.append(cell);
    body.append(row);
  }
}

loadHotels();
