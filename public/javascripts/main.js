// public/javascripts/main.js

// Wait for document to be ready
document.addEventListener("DOMContentLoaded", () => {
  initializeLoader();
  initializeCustomCursor();
  initializeParallax();
  initializeTextSplitting();
  initializeSmoothScroll();
  initializePropertyCards();
  initializeSwiper();
  init3DCards();
  initializeAOS();
  setupFormValidation();
});

// Page Loader
function initializeLoader() {
  const loader = document.querySelector(".page-loader");
  if (loader) {
    window.addEventListener("load", () => {
      loader.style.opacity = "0";
      setTimeout(() => {
        loader.style.display = "none";
        // Trigger entrance animations after loader
        document.body.classList.add("loaded");
      }, 500);
    });
  }
}

// Custom Cursor
function initializeCustomCursor() {
  const cursor = document.querySelector(".custom-cursor");
  const follower = document.querySelector(".custom-cursor-follower");

  if (!cursor || !follower) return;

  document.addEventListener("mousemove", (e) => {
    cursor.style.transform = `translate(${e.clientX - 10}px, ${
      e.clientY - 10
    }px)`;
    follower.style.transform = `translate(${e.clientX - 4}px, ${
      e.clientY - 4
    }px)`;
  });

  // Add hover effect for clickable elements
  document.querySelectorAll("a, button, .clickable").forEach((el) => {
    el.addEventListener("mouseenter", () => {
      cursor.classList.add("cursor-hover");
      follower.classList.add("cursor-hover");
    });

    el.addEventListener("mouseleave", () => {
      cursor.classList.remove("cursor-hover");
      follower.classList.remove("cursor-hover");
    });
  });
}

// Parallax Effects
function initializeParallax() {
  const parallaxElements = document.querySelectorAll("[data-parallax]");

  window.addEventListener("scroll", () => {
    const scrolled = window.pageYOffset;

    parallaxElements.forEach((el) => {
      const speed = el.dataset.parallax || 0.5;
      const yPos = -(scrolled * speed);
      el.style.transform = `translate3d(0, ${yPos}px, 0)`;
    });
  });
}

// Text Splitting Animation
function initializeTextSplitting() {
  const splitTextElements = document.querySelectorAll(".split-text");

  splitTextElements.forEach((element) => {
    const text = element.textContent;
    element.textContent = "";

    [...text].forEach((char, i) => {
      const span = document.createElement("span");
      span.textContent = char;
      span.style.animationDelay = `${i * 0.05}s`;
      element.appendChild(span);
    });
  });
}

// Smooth Scroll
function initializeSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    });
  });
}

// Property Cards Interaction
function initializePropertyCards() {
  const cards = document.querySelectorAll(".property-card");

  cards.forEach((card) => {
    card.addEventListener("mouseenter", (e) => {
      const bounds = card.getBoundingClientRect();
      const mouseX = e.clientX - bounds.left;
      const mouseY = e.clientY - bounds.top;

      const rotateX = (mouseY / bounds.height - 0.5) * 20;
      const rotateY = (mouseX / bounds.width - 0.5) * 20;

      card.style.transform = `perspective(1000px) rotateX(${-rotateX}deg) rotateY(${rotateY}deg)`;
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "perspective(1000px) rotateX(0) rotateY(0)";
    });
  });
}

// Swiper Initialization
function initializeSwiper() {
  new Swiper(".swiper-container", {
    slidesPerView: 1,
    spaceBetween: 30,
    loop: true,
    pagination: {
      el: ".swiper-pagination",
      clickable: true,
    },
    navigation: {
      nextEl: ".swiper-button-next",
      prevEl: ".swiper-button-prev",
    },
    autoplay: {
      delay: 5000,
      disableOnInteraction: false,
    },
    breakpoints: {
      640: {
        slidesPerView: 2,
      },
      968: {
        slidesPerView: 3,
      },
    },
  });
}

// 3D Card Effect
function init3DCards() {
  const cards = document.querySelectorAll(".card-3d-wrap");

  cards.forEach((card) => {
    card.addEventListener("mousemove", cardEffect);
    card.addEventListener("mouseleave", resetCard);
  });
}

function cardEffect(e) {
  const card = this.querySelector(".card-3d-wrapper");
  const bounds = this.getBoundingClientRect();
  const mouseX = e.clientX - bounds.left;
  const mouseY = e.clientY - bounds.top;
  const rotateY = (mouseX / bounds.width) * 30 - 15;
  const rotateX = (mouseY / bounds.height) * -30 + 15;

  card.style.transform = `rotateY(${rotateY}deg) rotateX(${rotateX}deg)`;
}

function resetCard(e) {
  const card = this.querySelector(".card-3d-wrapper");
  card.style.transform = `rotateY(0deg) rotateX(0deg)`;
}

// Initialize AOS (Animate on Scroll)
function initializeAOS() {
  AOS.init({
    duration: 1000,
    easing: "ease-out",
    once: true,
  });
}

// Form Validation and Submission
function setupFormValidation() {
  const forms = document.querySelectorAll("form");

  forms.forEach((form) => {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (form.checkValidity()) {
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;

        try {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<span class="spinner"></span> Submitting...';

          const formData = new FormData(form);
          const response = await fetch(form.action, {
            method: "POST",
            body: formData,
          });

          const result = await response.json();

          if (result.success) {
            showNotification("success", result.message);
            form.reset();
          } else {
            showNotification("error", result.message);
          }
        } catch (error) {
          showNotification("error", "Something went wrong. Please try again.");
        } finally {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
        }
      } else {
        form.classList.add("was-validated");
      }
    });
  });
}

// Custom Notification System
function showNotification(type, message) {
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.innerHTML = `
        <div class="notification-content">
            <i class="notification-icon"></i>
            <span>${message}</span>
        </div>
    `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add("show");
  }, 10);

  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

// Scroll Animation Detection
function handleScrollAnimations() {
  const elements = document.querySelectorAll(".animate-on-scroll");

  const isInViewport = (el) => {
    const rect = el.getBoundingClientRect();
    return (
      rect.top <=
        (window.innerHeight || document.documentElement.clientHeight) &&
      rect.bottom >= 0
    );
  };

  const handleScroll = () => {
    elements.forEach((el) => {
      if (isInViewport(el)) {
        el.classList.add("in-view");
      }
    });
  };

  window.addEventListener("scroll", handleScroll);
  handleScroll(); // Check on load
}

// Property Search Functionality
function initializePropertySearch() {
  const searchForm = document.querySelector(".property-search-form");
  if (!searchForm) return;

  searchForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(searchForm);
    const searchParams = new URLSearchParams(formData);

    try {
      const response = await fetch(`/search?${searchParams.toString()}`);
      const data = await response.json();

      if (data.success) {
        updatePropertyResults(data.properties);
      } else {
        showNotification("error", "Search failed. Please try again.");
      }
    } catch (error) {
      showNotification("error", "Something went wrong with the search.");
    }
  });
}

// Update Property Results
function updatePropertyResults(properties) {
  const resultsContainer = document.querySelector(".property-results");
  if (!resultsContainer) return;

  resultsContainer.innerHTML = properties
    .map(
      (property) => `
        <div class="property-card" data-aos="fade-up">
            <!-- Property card template -->
        </div>
    `
    )
    .join("");

  // Reinitialize AOS for new elements
  AOS.refresh();
}

// Export functions for use in other scripts
window.realEstate = {
  showNotification,
  initializePropertySearch,
  updatePropertyResults,
};
