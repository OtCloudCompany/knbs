import { CommonModule } from '@angular/common';
import { Component, OnInit, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';


@Component({
  selector: 'ds-modal-content',
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './modal-content.component.html',
  styleUrl: './modal-content.component.scss',
})
export class ModalContentComponent implements OnInit {
  @Input() title!: string;
  @Input() content!: string;
  @Input() apaCitation!: string;
  @Input() chicagoCitation!: string;
  @Input() mlaCitation!: string;
  @Input() vancouverCitation!: string;
  @Input() harvardCitation!: string;
  @Input() isoCitation!: string;

  selectedCitation = 'APA';
  currentCitation!: string;
  itemTitle: string;
  copied = false;

  constructor(public activeModal: NgbActiveModal, private modalService: NgbModal) { }

  ngOnInit(): void {
    this.updateCitation();
  }

  updateCitation() {
    switch (this.selectedCitation) {
      case 'MLA':
        this.currentCitation = this.mlaCitation;
        break;
      case 'Chicago':
        this.currentCitation = this.chicagoCitation;
        break;
      case 'Vancouver':
        this.currentCitation = this.vancouverCitation.substring(3);
        break;
      case 'Harvard':
        this.currentCitation = this.harvardCitation;
        break;
      case 'iso690-2':
        this.currentCitation = this.isoCitation;
        break;
      case 'APA':
      default:
        this.currentCitation = this.apaCitation;
        break;
    }
  }

  modalOpen() {
    const modalRef = this.modalService.open(ModalContentComponent);
    modalRef.componentInstance.title = this.itemTitle;

    modalRef.componentInstance.apaCitation = this.apaCitation;
    modalRef.componentInstance.mlaCitation = this.mlaCitation;
    modalRef.componentInstance.vancouverCitation = this.vancouverCitation;
    modalRef.componentInstance.harvardCitation = this.harvardCitation;
    modalRef.componentInstance.isoCitation = this.isoCitation;
    modalRef.componentInstance.chicagoCitation = this.chicagoCitation;
  }

  copyToClipboard() {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = this.currentCitation;
    const plainText = tempDiv.textContent || tempDiv.innerText || '';
    navigator.clipboard.writeText(plainText).then(() => {
      this.copied = true;
      setTimeout(() => this.copied = false, 2000);
    });
  }

}
