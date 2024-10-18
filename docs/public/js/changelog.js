(function (window, document) {
  const SuggestFeature = {
    init: function (config) {
      this.domain = config.domain || 'https://feedback.suggestfeature.com';
      this.position = config.position || 'bottom';
      this.align = config.align || 'left';
      this.theme = config.theme || 'light';
      this.lastViewedTimestamp = this.getLastViewedTimestamp();
      this.isOpen = false;
      this.triggerElement = null;
      this.unreadIndicator = null;

      this.createStyles();
      this.createWidget();
      this.attachEventListeners();
      this.checkForNewChangelogs();
    },

    createStyles: function () {
      const style = document.createElement('style');
      style.textContent = `
        .sf-changelog-widget {
          position: absolute;
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          width: 300px;
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
        .sf-changelog-items {
          max-height: 300px;
          overflow-y: auto;
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
          border-top: 1px solid #e0e0e0;
        }
        .sf-changelog-footer a {
          color: #007bff;
          text-decoration: none;
        }
        .sf-theme-dark .sf-changelog-footer a {
          color: #4da6ff;
        }
        .sf-unread-indicator {
          position: absolute;
          top: -5px;
          right: -5px;
          width: 10px;
          height: 10px;
          background-color: #ff0000;
          border-radius: 50%;
          display: none;
        }
        [data-sf-changelog] {
          position: relative;
          cursor: pointer;
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
      document.querySelectorAll('[data-sf-changelog]').forEach(element => {
        element.addEventListener('click', (event) => this.toggleWidget(event));
        this.triggerElement = element;
        this.addUnreadIndicator(element);
      });

      document.addEventListener('click', (event) => {
        if (!this.widget.contains(event.target) && !event.target.hasAttribute('data-sf-changelog')) {
          this.closeWidget();
        }
      });
    },

    addUnreadIndicator: function (element) {
      const indicator = document.createElement('div');
      indicator.className = 'sf-unread-indicator';
      element.appendChild(indicator);
      this.unreadIndicator = indicator;
    },

    toggleWidget: function (event) {
      if (this.isOpen) {
        this.closeWidget();
      } else {
        this.openWidget(event);
      }
    },

    openWidget: function (event) {
      this.fetchChangelog().then(() => {
        this.positionWidget(event.target);
        this.widget.style.display = 'block';
        this.isOpen = true;
        this.updateLastViewedTimestamp();
      });
    },

    closeWidget: function () {
      this.widget.style.display = 'none';
      this.isOpen = false;
    },

    positionWidget: function (triggerElement) {
      const triggerRect = triggerElement.getBoundingClientRect();
      const widgetRect = this.widget.getBoundingClientRect();

      let top, left;

      switch (this.position) {
        case 'top':
          top = triggerRect.top - widgetRect.height - 10;
          break;
        case 'bottom':
        default:
          top = triggerRect.bottom + 10;
          break;
      }

      switch (this.align) {
        case 'right':
          left = triggerRect.right - widgetRect.width;
          break;
        case 'left':
        default:
          left = triggerRect.left;
          break;
      }

      this.widget.style.top = `${top + window.scrollY}px`;
      this.widget.style.left = `${left + window.scrollX}px`;
    },

    fetchChangelog: function () {
      return fetch(`${this.domain}/api/portal/unauth/changelog/get-changelog-posts?limit=5`)
        .then(response => response.json())
        .then(data => {
          this.renderChangelog(data);
          this.checkForUnreadChangelogs(data);
        })
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
          <div class="sf-changelog-item-content">${this.truncateContent(item.html, 100)}</div>
        `;
        itemElement.addEventListener('click', () => {
          window.location.href = `${this.domain}/changelog/${item.slug}`;
        });
        itemsContainer.appendChild(itemElement);
      });
    },

    truncateContent: function (html, maxLength) {
      const tmp = document.createElement('div');
      tmp.innerHTML = html;
      let text = tmp.textContent || tmp.innerText || '';

      if (text.length > maxLength) {
        text = text.substr(0, maxLength) + '...';
      }

      return text;
    },

    getLastViewedTimestamp: function () {
      const timestamp = localStorage.getItem('sf-last-viewed-changelog');
      return timestamp ? new Date(timestamp) : new Date(0);
    },

    updateLastViewedTimestamp: function () {
      const now = new Date();
      localStorage.setItem('sf-last-viewed-changelog', now.toISOString());
      this.lastViewedTimestamp = now;
      this.unreadIndicator.style.display = 'none';
    },

    checkForUnreadChangelogs: function (data) {
      const hasUnread = data.some(item => new Date(item.changelogDate) > this.lastViewedTimestamp);
      if (this.unreadIndicator) {
        this.unreadIndicator.style.display = hasUnread ? 'block' : 'none';
      }
    },

    checkForNewChangelogs: function () {
      this.fetchChangelog();
    }
  };

  window.SuggestFeature = SuggestFeature;
})(window, document);
