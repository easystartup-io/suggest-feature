(function (window, document) {
  const SuggestFeature = {
    init: function (config) {
      this.domain = config.domain || 'https://feedback.suggestfeature.com';
      this.position = config.position || 'bottom';
      this.align = config.align || 'left';
      this.theme = config.theme || 'light';

      this.createStyles();
      this.createWidget();
      this.attachEventListeners();
    },

    createStyles: function () {
      const style = document.createElement('style');
      style.textContent = `
        .sf-changelog-widget {
          position: fixed;
          ${this.position}: 20px;
          ${this.align}: 20px;
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          width: 300px;
          max-height: 400px;
          overflow-y: auto;
          z-index: 1000;
          font-family: Arial, sans-serif;
          display: none;
        }
        .sf-changelog-widget.sf-theme-dark {
          background-color: #333333;
          color: #ffffff;
        }
        .sf-changelog-header {
          padding: 15px;
          font-weight: bold;
          border-bottom: 1px solid #e0e0e0;
        }
        .sf-changelog-item {
          padding: 15px;
          border-bottom: 1px solid #e0e0e0;
          cursor: pointer;
        }
        .sf-changelog-item:hover {
          background-color: #f5f5f5;
        }
        .sf-theme-dark .sf-changelog-item:hover {
          background-color: #444444;
        }
        .sf-changelog-item-title {
          font-weight: bold;
          margin-bottom: 5px;
        }
        .sf-changelog-item-content {
          font-size: 14px;
          color: #666666;
        }
        .sf-theme-dark .sf-changelog-item-content {
          color: #cccccc;
        }
        .sf-changelog-footer {
          padding: 15px;
          text-align: center;
        }
        .sf-changelog-footer a {
          color: #007bff;
          text-decoration: none;
        }
        .sf-theme-dark .sf-changelog-footer a {
          color: #4da6ff;
        }
      `;
      document.head.appendChild(style);
    },

    createWidget: function () {
      const widget = document.createElement('div');
      widget.className = `sf-changelog-widget sf-theme-${this.theme}`;
      widget.innerHTML = `
        <div class="sf-changelog-header">Latest Updates</div>
        <div class="sf-changelog-items"></div>
        <div class="sf-changelog-footer">
          <a href="${this.domain}/changelog">See all changes</a>
        </div>
      `;
      document.body.appendChild(widget);
      this.widget = widget;
    },

    attachEventListeners: function () {
      document.querySelectorAll('[data-sf-changelog]').forEach(button => {
        button.addEventListener('click', () => this.toggleWidget());
      });

      document.addEventListener('click', (event) => {
        if (!this.widget.contains(event.target) && !event.target.hasAttribute('data-sf-changelog')) {
          this.widget.style.display = 'none';
        }
      });
    },

    toggleWidget: function () {
      if (this.widget.style.display === 'none') {
        this.widget.style.display = 'block';
        this.fetchChangelog();
      } else {
        this.widget.style.display = 'none';
      }
    },

    fetchChangelog: function () {
      fetch(`${this.domain}/api/portal/unauth/changelog/get-changelog-posts?limit=5`)
        .then(response => response.json())
        .then(data => this.renderChangelog(data))
        .catch(error => console.error('Error fetching changelog:', error));
    },

    renderChangelog: function (data) {
      const itemsContainer = this.widget.querySelector('.sf-changelog-items');
      itemsContainer.innerHTML = '';

      data.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'sf-changelog-item';
        itemElement.innerHTML = `
          <div class="sf-changelog-item-title">${item.title}</div>
          <div class="sf-changelog-item-content">${item.content}</div>
        `;
        itemElement.addEventListener('click', () => {
          window.location.href = `${this.domain}/changelog/${item.slug}`;
        });
        itemsContainer.appendChild(itemElement);
      });
    }
  };

  window.SuggestFeature = SuggestFeature;
})(window, document);
