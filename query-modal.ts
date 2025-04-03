import { App, Modal, Setting } from "obsidian";
import { ImageSearchPluginSettings } from 'image-search-settings-tab';
import { requestUrl } from "obsidian";


export class QueryModal extends Modal {
  private result: string;
  private settings: ImageSearchPluginSettings;
  private imageList: HTMLElement;
  private onSubmit: (result: string) => void;

  constructor(app: App, settings: ImageSearchPluginSettings, onSubmit: (result: string) => void) {
    super(app);
    this.settings = settings;
    this.onSubmit = onSubmit;
  }

  onOpen() {
    const form = this.contentEl.createEl('form');
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      this.search();
    });

    const input = this.contentEl.createEl('input', {
      attr: {
        type: 'text',
        placeholder: "What are you looking for?"
      },
      cls: 'setting-input input-style',
    });
    input.addEventListener('input', (event) => {
      this.result = (event.target as HTMLInputElement).value;
    });
    form.appendChild(input);

    const buttonContainer = this.contentEl.createEl('div', {
      cls: 'button-container-style'
    });
    const button = this.contentEl.createEl('button', {
      attr: {
        type: 'submit'
      },
      cls: 'mod-cta setting-btn button-style',
    });
    button.textContent = "Search Google Images";
    buttonContainer.appendChild(button);
    form.appendChild(buttonContainer);

    this.imageList = this.contentEl.createEl("ul", { cls: "responsive-gallery" });
  }

  private async callApi(query: string): Promise<string[]> {
    const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&cx=${this.settings.searchEngineId}&searchType=image&num=30&key=${this.settings.apiKey}`;
    const response = await requestUrl(url);

    if (response.status < 200 || response.status >= 300) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json;
    return data.items.map((item: any) => item.link);
  }

  private async search() {
    this.imageList.empty();
    try {
      const results = await this.callApi(this.result);
      results.forEach(elem => {
        const li = this.imageList.createEl("li");
        li.createEl("img", { attr: { src: elem } }).onClickEvent(() => {
          this.onSubmit(elem);
          this.close();
        });
      });
    } catch (error) {
      console.error(`Error occured in "Image Search" plugin:\n${error}`);
      this.imageList
        .createDiv({ cls: "responsive-gallery-error" })
        .setText("Search was unsuccessful. Please check your connection, the API Key and Search engine ID in settings.");
    }
  }

  onClose() {
    this.contentEl.empty();
  }
}

