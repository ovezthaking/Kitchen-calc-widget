import React from 'react';
import ReactDOM from 'react-dom/client';
import { KitchenCalculator } from './components/KitchenCalculator';
import styles from './index.css?inline';

// Tailwind v4 wymaga @property w globalnym document.head, ponieważ przeglądarki ignorują @property wewnątrz Shadow DOM
function ensureTailwindPropertiesInDocumentHead() {
  const styleId = 'kc-tw-properties';
  if (typeof document === 'undefined' || document.getElementById(styleId)) return;

  const propertyRules = styles.match(/@property\s+--[\w-]+\s*\{[^}]*\}/g);
  if (propertyRules && propertyRules.length > 0) {
    const headStyle = document.createElement('style');
    headStyle.id = styleId;
    headStyle.textContent = propertyRules.join('\n');
    document.head.appendChild(headStyle);
  }
}

class KitchenCalculatorElement extends HTMLElement {
  private root: ReactDOM.Root | null = null;

  connectedCallback() {
    ensureTailwindPropertiesInDocumentHead();

    const shadow = this.shadowRoot ?? this.attachShadow({ mode: 'open' });

    if (!this.root) {
      shadow.innerHTML = '';
      const styleTag = document.createElement('style');
      styleTag.textContent = styles;
      shadow.appendChild(styleTag);

      const mountPoint = document.createElement('div');
      shadow.appendChild(mountPoint);

      this.root = ReactDOM.createRoot(mountPoint);
    }

    this.root.render(
      <React.StrictMode>
        <KitchenCalculator />
      </React.StrictMode>
    );
  }

  disconnectedCallback() {
    this.root?.unmount();
    this.root = null;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('kitchen-calculator')) {
  customElements.define('kitchen-calculator', KitchenCalculatorElement);
}
