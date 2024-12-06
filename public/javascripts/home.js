// Featured Properties Pagination
const featuredPropertiesContainer = document.querySelector(".featured-properties .property-grid");
const featuredPrevButton = document.querySelector(".featured-properties .prev-button");
const featuredNextButton = document.querySelector(".featured-properties .next-button");
const featuredCurrentPage = document.querySelector(".featured-properties .current-page");
const featuredTotalPages = document.querySelector(".featured-properties .total-pages");
const featuredPropertyCards = featuredPropertiesContainer.querySelectorAll(".property-card");

let featuredCurrentPageIndex = 0;
const featuredPropertiesPerPage = window.innerWidth > 991 ? 3 : 1;

function updateFeaturedPropertiesDisplay() {
  const start = featuredCurrentPageIndex * featuredPropertiesPerPage;
  const end = start + featuredPropertiesPerPage;

  featuredPropertyCards.forEach((card, index) => {
    if (index >= start && index < end) {
      card.style.display = "block";
      card.classList.add(
        "animate__animated",
        "animate__backInUp",
        "animate__delay-0.5s",
        "animate__duration-1s"
      );
      card.querySelector(".property-info").classList.add(
        "animate__animated",
        "animate__fadeInRight",
        "animate__delay-1s",
        "animate__duration-1s"
      );
    } else {
      card.style.display = "none";
      card.classList.remove(
        "animate__animated",
        "animate__backInUp",
        "animate__delay-0.5s",
        "animate__duration-1s"
      );
      card.querySelector(".property-info").classList.remove(
        "animate__animated",
        "animate__fadeInRight",
        "animate__delay-1s",
        "animate__duration-1s"
      );
    }
  });

  featuredCurrentPage.textContent = featuredCurrentPageIndex + 1;
  featuredTotalPages.textContent = Math.ceil(featuredPropertyCards.length / featuredPropertiesPerPage);
}

function autoMoveFeaturedProperties() {
  featuredCurrentPageIndex++;
  const totalPages = Math.ceil(featuredPropertyCards.length / featuredPropertiesPerPage);

  if (featuredCurrentPageIndex >= totalPages) {
    featuredCurrentPageIndex = 0;
  }

  updateFeaturedPropertiesDisplay();
}

let featuredPropertiesInterval = setInterval(autoMoveFeaturedProperties, 5000);

featuredPrevButton.addEventListener("click", () => {
  clearInterval(featuredPropertiesInterval);
  if (featuredCurrentPageIndex > 0) {
    featuredCurrentPageIndex--;
    updateFeaturedPropertiesDisplay();
  }
  featuredPropertiesInterval = setInterval(autoMoveFeaturedProperties, 5000);
});

featuredNextButton.addEventListener("click", () => {
  clearInterval(featuredPropertiesInterval);
  const totalPages = Math.ceil(featuredPropertyCards.length / featuredPropertiesPerPage);
  if (featuredCurrentPageIndex < totalPages - 1) {
    featuredCurrentPageIndex++;
    updateFeaturedPropertiesDisplay();
  }
  featuredPropertiesInterval = setInterval(autoMoveFeaturedProperties, 5000);
});

window.addEventListener("resize", () => {
  clearInterval(featuredPropertiesInterval);
  updateFeaturedPropertiesDisplay();
  featuredPropertiesInterval = setInterval(autoMoveFeaturedProperties, 5000);
});

updateFeaturedPropertiesDisplay();
featuredPropertiesInterval = setInterval(autoMoveFeaturedProperties, 5000);

// Latest Properties Pagination
const latestPropertiesContainer = document.querySelector(".latest-properties .property-grid");
const latestPrevButton = document.querySelector(".latest-properties .prev-button");
const latestNextButton = document.querySelector(".latest-properties .next-button");
const latestCurrentPage = document.querySelector(".latest-properties .current-page");
const latestTotalPages = document.querySelector(".latest-properties .total-pages");
const latestPropertyCards = latestPropertiesContainer.querySelectorAll(".property-card");

let latestCurrentPageIndex = 0;
const latestPropertiesPerPage = window.innerWidth > 991 ? 3 : 1;

function updateLatestPropertiesDisplay() {
  const start = latestCurrentPageIndex * latestPropertiesPerPage;
  const end = start + latestPropertiesPerPage;

  latestPropertyCards.forEach((card, index) => {
    if (index >= start && index < end) {
      card.style.display = "block";
      card.classList.add(
        "animate__animated",
        "animate__flipInX",
        "animate__delay-0.5s",
        "animate__duration-1s"
      );
      card.querySelector(".property-info").classList.add(
        "animate__animated",
        "animate__fadeInRight",
        "animate__delay-1s",
        "animate__duration-1s"
      );
    } else {
      card.style.display = "none";
      card.classList.remove(
        "animate__animated",
        "animate__flipInX",
        "animate__delay-0.5s",
        "animate__duration-1s"
      );
      card.querySelector(".property-info").classList.remove(
        "animate__animated",
        "animate__fadeInRight",
        "animate__delay-1s",
        "animate__duration-1s"
      );
    }
  });

  latestCurrentPage.textContent = latestCurrentPageIndex + 1;
  latestTotalPages.textContent = Math.ceil(latestPropertyCards.length / latestPropertiesPerPage);
}

function autoMoveLatestProperties() {
  latestCurrentPageIndex++;
  const totalPages = Math.ceil(latestPropertyCards.length / latestPropertiesPerPage);

  if (latestCurrentPageIndex >= totalPages) {
    latestCurrentPageIndex = 0;
  }

  updateLatestPropertiesDisplay();
}

let latestPropertiesInterval = setInterval(autoMoveLatestProperties, 5000);

latestPrevButton.addEventListener("click", () => {
  clearInterval(latestPropertiesInterval);
  if (latestCurrentPageIndex > 0) {
    latestCurrentPageIndex--;
    updateLatestPropertiesDisplay();
  }
  latestPropertiesInterval = setInterval(autoMoveLatestProperties, 5000);
});

latestNextButton.addEventListener("click", () => {
  clearInterval(latestPropertiesInterval);
  const totalPages = Math.ceil(latestPropertyCards.length / latestPropertiesPerPage);
  if (latestCurrentPageIndex < totalPages - 1) {
    latestCurrentPageIndex++;
    updateLatestPropertiesDisplay();
  }
  latestPropertiesInterval = setInterval(autoMoveLatestProperties, 5000);
});

window.addEventListener("resize", () => {
  clearInterval(latestPropertiesInterval);
  updateLatestPropertiesDisplay();
  latestPropertiesInterval = setInterval(autoMoveLatestProperties, 5000);
});

updateLatestPropertiesDisplay();
latestPropertiesInterval = setInterval(autoMoveLatestProperties, 5000);