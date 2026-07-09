import { Component, OnInit, Input } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Item } from 'src/app/core/shared/item.model';
import { ModalContentComponent } from '../modal-content/modal-content.component';
import { TranslateModule } from '@ngx-translate/core';

import { Cite, plugins } from '@citation-js/core';
import '@citation-js/plugin-csl';
import '@citation-js/plugin-bibtex';
import '@citation-js/plugin-ris';

@Component({
  selector: 'ds-citation-generator',
  imports: [TranslateModule],
  templateUrl: './citation-generator.component.html',
  styleUrl: './citation-generator.component.scss',
})
export class CitationGeneratorComponent implements OnInit {

  vancouverCitation: string;
  apaCitation: string;
  chicagoCitation: string;
  harvardCitation: string;
  mlaCitation: string;
  isoCitation: string;
  bibtexCitation: string;
  endNoteCitation: string;
  csvCitation: string;

  itemTitle: string;
  citationsLoaded = false;
  identifierURLs: string[];
  handleIdentifier: string;

  @Input() object: Item;

  constructor(
    private modalService: NgbModal,
  ) { }

  ngOnInit(): void {
    this.itemTitle = this.object.firstMetadataValue(['dc.title']);
    this.identifierURLs = this.object.allMetadataValues(['dc.identifier.uri']);
    this.handleIdentifier = this.identifierURLs[this.identifierURLs.length - 1];
    this.generateCitations();
  }

  extractDateParts(dateStr: string): number[] {
    return dateStr.split('-').map(part => parseInt(part, 10));
  }

  generateCitations() {
    let dateIssued = this.object.firstMetadataValue(['dc.date.issued']);
    const cite = new Cite({
      type: 'article-journal',
      title: this.object.firstMetadataValue(['dc.title']),
      author: this.object.allMetadataValues(['dc.contributor.author']),
      issued: {
        'date-parts': [this.extractDateParts(dateIssued)]
      },
      'container-title': this.object.firstMetadataValue(['dc.publisher']),
      publisher: this.object.firstMetadataValue(['dc.publisher']),
      URL: this.handleIdentifier // get last url, first url could be external
    });

    this.apaCitation = cite.format('bibliography', {
      format: 'html',
      template: 'apa',
      lang: 'en-US'
    });
    this.vancouverCitation = cite.format('bibliography', {
      format: 'text',
      template: 'vancouver',
      lang: 'en-US'
    });
    this.harvardCitation = cite.format('bibliography', {
      format: 'html',
      template: 'harvard1',
      lang: 'en-US'
    });
    // Register the MLA CSL style using the content as text
    plugins.config.get('@csl').templates.add('mla', this.getMLATemplate());
    this.mlaCitation = cite.format('bibliography', {
      format: 'html',
      template: 'mla',
      lang: 'en-US'
    });
    // Register the ISO-690 CSL style using the content as text
    plugins.config.get('@csl').templates.add('iso690-2', this.getISO690Template());
    this.isoCitation = cite.format('bibliography', {
      format: 'html',
      template: 'iso690-2',
      lang: 'en-US'
    });
    // Register the Chicago CSL style using the content as text
    plugins.config.get('@csl').templates.add('chicago', this.getChicagoTemplate());
    this.chicagoCitation = cite.format('bibliography', {
      format: 'html',
      template: 'chicago',
      lang: 'en-US'
    });
    this.bibtexCitation = cite.format('bibtex', { format: 'text' });

    this.endNoteCitation = cite.format('ris', { format: 'text' });

    this.csvCitation = this.convertToCSV(cite);

    this.citationsLoaded = true;
  }
  convertToCSV(cite) {
    const data = cite.data;
    const headers = ['Tipo', 'Titulo', 'Autor', 'Fecha', 'Diario', 'Editora', 'URL'];
    const escapeCSV = (field) => {
      if (field.includes(',') || field.includes('"')) {
        return `"${field.replace(/"/g, '""')}"`;
      }
      return field;
    };
    const rows = data.map(entry => {
      const authors = entry.author.map(a => `${a.given} ${a.family}`).join('; ');
      const issuedDate = entry.issued['date-parts'][0].join('-');

      return [
        escapeCSV(entry.type || ''),
        escapeCSV(entry.title || ''),
        escapeCSV(authors || ''),
        escapeCSV(issuedDate || ''),
        escapeCSV(entry['container-title'] || ''),
        escapeCSV(entry.publisher || ''),
        escapeCSV(entry.URL || '')
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }

  downloadCitation(format: string) {
    let citation: string;
    let fileName: string;
    let mimeType: string;

    if (format === 'endnote') {
      citation = this.endNoteCitation;
      fileName = 'citation.ris';
      mimeType = 'application/x-research-info-systems';
    } else if (format === 'bibtex') {
      citation = this.bibtexCitation;
      fileName = 'citation.bib';
      mimeType = 'application/x-bibtex';
    } else if (format === 'csv') {
      citation = this.csvCitation;
      fileName = 'citation.csv';
      mimeType = 'text/csv';
    }

    const blob = new Blob([citation], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
  }
  getMLATemplate() {
    return '<?xml version="1.0" encoding="utf-8"?>\n' +
      '<style xmlns="http://purl.org/net/xbiblio/csl" class="in-text" version="1.0" demote-non-dropping-particle="never" page-range-format="minimal-two">\n' +
      '  <info>\n' +
      '    <title>Modern Language Association 9th edition</title>\n' +
      '    <title-short>MLA</title-short>\n' +
      '    <id>http://www.zotero.org/styles/modern-language-association</id>\n' +
      '    <link href="http://www.zotero.org/styles/modern-language-association" rel="self"/>\n' +
      '    <link href="http://style.mla.org" rel="documentation"/>\n' +
      '    <author>\n' +
      '      <name>Sebastian Karcher</name>\n' +
      '    </author>\n' +
      '    <contributor>\n' +
      '      <name>Patrick O\'Brien</name>\n' +
      '    </contributor>\n' +
      '    <category citation-format="author"/>\n' +
      '    <category field="generic-base"/>\n' +
      '    <summary>This style adheres to the MLA 9th edition handbook. Follows the structure of references as outlined in the MLA Manual closely</summary>\n' +
      '    <updated>2023-07-21T20:05:10+00:00</updated>\n' +
      '    <rights license="http://creativecommons.org/licenses/by-sa/3.0/">This work is licensed under a Creative Commons Attribution-ShareAlike 3.0 License</rights>\n' +
      '  </info>\n' +
      '  <locale xml:lang="en">\n' +
      '    <date form="text">\n' +
      '      <date-part name="day" suffix=" "/>\n' +
      '      <date-part name="month" suffix=" " form="short"/>\n' +
      '      <date-part name="year"/>\n' +
      '    </date>\n' +
      '    <terms>\n' +
      '      <term name="month-01" form="short">Jan.</term>\n' +
      '      <term name="month-02" form="short">Feb.</term>\n' +
      '      <term name="month-03" form="short">Mar.</term>\n' +
      '      <term name="month-04" form="short">Apr.</term>\n' +
      '      <term name="month-05" form="short">May</term>\n' +
      '      <term name="month-06" form="short">June</term>\n' +
      '      <term name="month-07" form="short">July</term>\n' +
      '      <term name="month-08" form="short">Aug.</term>\n' +
      '      <term name="month-09" form="short">Sept.</term>\n' +
      '      <term name="month-10" form="short">Oct.</term>\n' +
      '      <term name="month-11" form="short">Nov.</term>\n' +
      '      <term name="month-12" form="short">Dec.</term>\n' +
      '      <term name="translator" form="short">trans.</term>\n' +
      '    </terms>\n' +
      '  </locale>\n' +
      '  <macro name="author">\n' +
      '    <names variable="author">\n' +
      '      <name name-as-sort-order="first" and="text" delimiter-precedes-last="always" delimiter-precedes-et-al="always" initialize="false" initialize-with=". "/>\n' +
      '      <label form="long" prefix=", "/>\n' +
      '      <substitute>\n' +
      '        <names variable="editor"/>\n' +
      '        <names variable="translator"/>\n' +
      '        <text macro="title"/>\n' +
      '      </substitute>\n' +
      '    </names>\n' +
      '  </macro>\n' +
      '  <macro name="author-short">\n' +
      '    <group delimiter=", ">\n' +
      '      <names variable="author">\n' +
      '        <name form="short" initialize-with=". " and="text"/>\n' +
      '        <substitute>\n' +
      '          <names variable="editor"/>\n' +
      '          <names variable="translator"/>\n' +
      '          <text macro="title-short"/>\n' +
      '        </substitute>\n' +
      '      </names>\n' +
      '      <choose>\n' +
      '        <if disambiguate="true">\n' +
      '          <text macro="title-short"/>\n' +
      '        </if>\n' +
      '      </choose>\n' +
      '    </group>\n' +
      '  </macro>\n' +
      '  <macro name="title">\n' +
      '    <choose>\n' +
      '      <if variable="container-title" match="any">\n' +
      '        <text variable="title" quotes="true" text-case="title"/>\n' +
      '      </if>\n' +
      '      <else>\n' +
      '        <text variable="title" font-style="italic" text-case="title"/>\n' +
      '      </else>\n' +
      '    </choose>\n' +
      '  </macro>\n' +
      '  <macro name="title-short">\n' +
      '    <choose>\n' +
      '      <if variable="container-title" match="any">\n' +
      '        <text variable="title" form="short" quotes="true" text-case="title"/>\n' +
      '      </if>\n' +
      '      <else>\n' +
      '        <text variable="title" form="short" font-style="italic" text-case="title"/>\n' +
      '      </else>\n' +
      '    </choose>\n' +
      '  </macro>\n' +
      '  <macro name="container-title">\n' +
      '    <text variable="container-title" font-style="italic" text-case="title"/>\n' +
      '  </macro>\n' +
      '  <macro name="other-contributors">\n' +
      '    <choose>\n' +
      '      <if variable="container-title" match="any">\n' +
      '        <group delimiter=", ">\n' +
      '          <names variable="container-author" delimiter=", ">\n' +
      '            <label form="verb" suffix=" "/>\n' +
      '            <name and="text"/>\n' +
      '          </names>\n' +
      '          <names variable="editor translator" delimiter=", ">\n' +
      '            <label form="verb" suffix=" "/>\n' +
      '            <name and="text"/>\n' +
      '          </names>\n' +
      '          <names variable="director illustrator interviewer" delimiter=", ">\n' +
      '            <label form="verb" suffix=" "/>\n' +
      '            <name and="text"/>\n' +
      '          </names>\n' +
      '        </group>\n' +
      '      </if>\n' +
      '      <else>\n' +
      '        <group delimiter=", ">\n' +
      '          <names variable="container-author" delimiter=", ">\n' +
      '            <label form="verb" suffix=" " text-case="capitalize-first"/>\n' +
      '            <name and="text"/>\n' +
      '          </names>\n' +
      '          <names variable="editor translator" delimiter=", ">\n' +
      '            <label form="verb" suffix=" " text-case="capitalize-first"/>\n' +
      '            <name and="text"/>\n' +
      '          </names>\n' +
      '          <names variable="director illustrator interviewer" delimiter=", ">\n' +
      '            <label form="verb" suffix=" " text-case="capitalize-first"/>\n' +
      '            <name and="text"/>\n' +
      '          </names>\n' +
      '        </group>\n' +
      '      </else>\n' +
      '    </choose>\n' +
      '  </macro>\n' +
      '  <macro name="version">\n' +
      '    <group delimiter=", ">\n' +
      '      <choose>\n' +
      '        <if is-numeric="edition">\n' +
      '          <group delimiter=" ">\n' +
      '            <number variable="edition" form="ordinal"/>\n' +
      '            <text term="edition" form="short"/>\n' +
      '          </group>\n' +
      '        </if>\n' +
      '        <else>\n' +
      '          <text variable="edition" text-case="capitalize-first"/>\n' +
      '        </else>\n' +
      '      </choose>\n' +
      '      <text variable="version"/>\n' +
      '      <text variable="medium"/>\n' +
      '    </group>\n' +
      '  </macro>\n' +
      '  <macro name="volume-lowercase">\n' +
      '    <group delimiter=" ">\n' +
      '      <text term="volume" form="short"/>\n' +
      '      <text variable="volume"/>\n' +
      '    </group>\n' +
      '  </macro>\n' +
      '  <macro name="number">\n' +
      '    <group delimiter=", ">\n' +
      '      <group>\n' +
      '        <choose>\n' +
      '          <!--lowercase if we have a preceding element-->\n' +
      '          <if variable="edition container-title" match="any">\n' +
      '            <text macro="volume-lowercase"/>\n' +
      '          </if>\n' +
      '          <!--other contributors preceding the volume-->\n' +
      '          <else-if variable="author" match="all">\n' +
      '            <choose>\n' +
      '              <if variable="editor translator container-author illustrator interviewer director" match="any">\n' +
      '                <text macro="volume-lowercase"/>\n' +
      '              </if>\n' +
      '            </choose>\n' +
      '          </else-if>\n' +
      '          <else-if variable="editor" match="all">\n' +
      '            <choose>\n' +
      '              <if variable="translator container-author illustrator interviewer director" match="any">\n' +
      '                <text macro="volume-lowercase"/>\n' +
      '              </if>\n' +
      '            </choose>\n' +
      '          </else-if>\n' +
      '          <else-if variable="container-author illustrator interviewer director" match="any">\n' +
      '            <text macro="volume-lowercase"/>\n' +
      '          </else-if>\n' +
      '          <else>\n' +
      '            <group delimiter=" ">\n' +
      '              <text term="volume" form="short" text-case="capitalize-first"/>\n' +
      '              <text variable="volume"/>\n' +
      '            </group>\n' +
      '          </else>\n' +
      '        </choose>\n' +
      '      </group>\n' +
      '      <group delimiter=" ">\n' +
      '        <text term="issue" form="short"/>\n' +
      '        <text variable="issue"/>\n' +
      '      </group>\n' +
      '      <choose>\n' +
      '        <if type="report">\n' +
      '          <text variable="genre"/>\n' +
      '        </if>\n' +
      '      </choose>\n' +
      '      <text variable="number"/>\n' +
      '    </group>\n' +
      '  </macro>\n' +
      '  <macro name="publisher">\n' +
      '    <choose>\n' +
      '      <if type="thesis" match="any">\n' +
      '        <group delimiter=". ">\n' +
      '          <date variable="issued" form="numeric" date-parts="year"/>\n' +
      '          <group delimiter=", ">\n' +
      '            <text variable="publisher"/>\n' +
      '            <text variable="genre"/>\n' +
      '          </group>\n' +
      '        </group>\n' +
      '      </if>\n' +
      '      <else-if type="article-magazine article-newspaper article-journal" match="none">\n' +
      '        <text variable="publisher"/>\n' +
      '      </else-if>\n' +
      '    </choose>\n' +
      '  </macro>\n' +
      '  <macro name="publication-date">\n' +
      '    <choose>\n' +
      '      <if type="book chapter paper-conference motion_picture" match="any">\n' +
      '        <date variable="issued" form="numeric" date-parts="year"/>\n' +
      '      </if>\n' +
      '      <else-if type="article-journal" match="any">\n' +
      '        <date variable="issued" form="text" date-parts="year-month"/>\n' +
      '      </else-if>\n' +
      '      <else-if type="speech thesis" match="none">\n' +
      '        <date variable="issued" form="text"/>\n' +
      '      </else-if>\n' +
      '    </choose>\n' +
      '  </macro>\n' +
      '  <macro name="location">\n' +
      '    <group delimiter=", ">\n' +
      '      <group delimiter=" ">\n' +
      '        <label variable="page" form="short"/>\n' +
      '        <text variable="page"/>\n' +
      '      </group>\n' +
      '      <choose>\n' +
      '        <if variable="source" match="none">\n' +
      '          <text macro="URI"/>\n' +
      '        </if>\n' +
      '      </choose>\n' +
      '    </group>\n' +
      '  </macro>\n' +
      '  <macro name="container2-title">\n' +
      '    <group delimiter=", ">\n' +
      '      <choose>\n' +
      '        <if type="speech">\n' +
      '          <text variable="event"/>\n' +
      '          <date variable="event-date" form="text"/>\n' +
      '          <text variable="event-place"/>\n' +
      '        </if>\n' +
      '      </choose>\n' +
      '      <text variable="archive"/>\n' +
      '      <text variable="archive-place"/>\n' +
      '      <text variable="archive_location"/>\n' +
      '    </group>\n' +
      '  </macro>\n' +
      '  <macro name="container2-location">\n' +
      '    <choose>\n' +
      '      <if variable="source">\n' +
      '        <choose>\n' +
      '          <if variable="DOI URL" match="any">\n' +
      '            <group delimiter=", ">\n' +
      '              <text variable="source" font-style="italic"/>\n' +
      '              <text macro="URI"/>\n' +
      '            </group>\n' +
      '          </if>\n' +
      '        </choose>\n' +
      '      </if>\n' +
      '    </choose>\n' +
      '  </macro>\n' +
      '  <macro name="URI">\n' +
      '    <choose>\n' +
      '      <if variable="DOI">\n' +
      '        <text variable="DOI" prefix="https://doi.org/"/>\n' +
      '      </if>\n' +
      '      <else>\n' +
      '        <text variable="URL"/>\n' +
      '      </else>\n' +
      '    </choose>\n' +
      '  </macro>\n' +
      '  <macro name="accessed">\n' +
      '    <!--using accessed where we don\'t have an issued date; follows recommendation on p. 53 -->\n' +
      '    <choose>\n' +
      '      <if variable="issued" match="none">\n' +
      '        <group delimiter=" ">\n' +
      '          <text term="accessed" text-case="capitalize-first"/>\n' +
      '          <date variable="accessed" form="text"/>\n' +
      '        </group>\n' +
      '      </if>\n' +
      '    </choose>\n' +
      '  </macro>\n' +
      '  <citation et-al-min="3" et-al-use-first="1" disambiguate-add-names="true" disambiguate-add-givenname="true">\n' +
      '    <layout prefix="(" suffix=")" delimiter="; ">\n' +
      '      <choose>\n' +
      '        <if locator="page line" match="any">\n' +
      '          <group delimiter=" ">\n' +
      '            <text macro="author-short"/>\n' +
      '            <text variable="locator"/>\n' +
      '          </group>\n' +
      '        </if>\n' +
      '        <else>\n' +
      '          <group delimiter=", ">\n' +
      '            <text macro="author-short"/>\n' +
      '            <group>\n' +
      '              <label variable="locator" form="short"/>\n' +
      '              <text variable="locator"/>\n' +
      '            </group>\n' +
      '          </group>\n' +
      '        </else>\n' +
      '      </choose>\n' +
      '    </layout>\n' +
      '  </citation>\n' +
      '  <bibliography hanging-indent="true" et-al-min="3" et-al-use-first="1" line-spacing="2" entry-spacing="0" subsequent-author-substitute="---">\n' +
      '    <sort>\n' +
      '      <key macro="author"/>\n' +
      '      <key variable="title"/>\n' +
      '    </sort>\n' +
      '    <layout suffix=".">\n' +
      '      <group delimiter=". ">\n' +
      '        <text macro="author"/>\n' +
      '        <text macro="title"/>\n' +
      '        <date variable="original-date" form="numeric" date-parts="year"/>\n' +
      '        <group delimiter=", ">\n' +
      '          <!---This group corresponds to MLA\'s "Container 1"-->\n' +
      '          <text macro="container-title"/>\n' +
      '          <text macro="other-contributors"/>\n' +
      '          <text macro="version"/>\n' +
      '          <text macro="number"/>\n' +
      '          <text macro="publisher"/>\n' +
      '          <text macro="publication-date"/>\n' +
      '          <text macro="location"/>\n' +
      '        </group>\n' +
      '        <group delimiter=", ">\n' +
      '          <!---This group corresponds to MLA\'s "Container 2"-->\n' +
      '          <!--currently just using this one for archival info-->\n' +
      '          <text macro="container2-title"/>\n' +
      '          <text macro="container2-location"/>\n' +
      '        </group>\n' +
      '        <text macro="accessed"/>\n' +
      '      </group>\n' +
      '    </layout>\n' +
      '  </bibliography>\n' +
      '</style>';
  }
  getISO690Template() {
    return '<?xml version="1.0" encoding="utf-8"?>\n' +
      '<style xmlns="http://purl.org/net/xbiblio/csl" version="1.0" class="note" demote-non-dropping-particle="sort-only" default-locale="sk-SK">\n' +
      '  <info>\n' +
      '    <title>ISO-690 (full note, Slovenčina)</title>\n' +
      '    <!--UPOZORNENIA: \n' +
      '      1. Pre zobrazovanie internetovej adresy pri citovaní elektronických periodík je nutné zapnúť túto funkciu v programe Zotero>Predvoľby>Citovanie>Štýly zaškrtnutím políčka dole.\n' +
      '      2. Zotero 5.0 zatiaľ nepodporuje zobrazenie rozsahu dátumov, napr. 1950 &#8211; 1975. Je však možné do Zotera zadať napr. 1950zzz1975 a pri finálnej úprave nahradiť "zzz" pomlčkou s medzerami: " &#8211; ".-->\n' +
      '    <id>http://www.zotero.org/styles/iso690-full-note-sk</id>\n' +
      '    <link href="http://www.zotero.org/styles/iso690-full-note-sk" rel="self"/>\n' +
      '    <link href="https://frcth.uniba.sk/fileadmin/rkcmbf/dekanat/legislativa/VP_1_2018_zaverecne_prace_01.pdf" rel="documentation"/>\n' +
      '    <author>\n' +
      '      <name>Pavel Vilhan</name>\n' +
      '      <email>Pavel(dot)Vilhan(at)frcth(dot)uniba(dot)sk</email>\n' +
      '      <uri>http://www.kniznice.eu</uri>\n' +
      '    </author>\n' +
      '    <category citation-format="note"/>\n' +
      '    <category field="theology"/>\n' +
      '    <summary>ISO 690 style for the Comenius University in Bratislava, Faculty of Roman Catholic Theology of Cyril and Methodius. Citations in notes with full bibliography (Metóda priebežných poznámok).</summary>\n' +
      '    <updated>2018-02-24T22:33:00+00:00</updated>\n' +
      '    <rights license="http://creativecommons.org/licenses/by-sa/3.0/">This work is licensed under a Creative Commons Attribution-ShareAlike 3.0 License</rights>\n' +
      '  </info>\n' +
      '  <locale xml:lang="sk">\n' +
      '    <terms>\n' +
      '      <term name="et-al">et al.</term>\n' +
      '      <term name="editor" form="short">\n' +
      '        <single>ed</single>\n' +
      '        <multiple>eds</multiple>\n' +
      '      </term>\n' +
      '      <term name="in">in:</term>\n' +
      '      <term name="page-range-delimiter">-</term>\n' +
      '    </terms>\n' +
      '  </locale>\n' +
      '  <macro name="contributors-full">\n' +
      '    <choose>\n' +
      '      <if variable="author">\n' +
      '        <names variable="author">\n' +
      '          <name name-as-sort-order="all" sort-separator=", " delimiter=", " delimiter-precedes-last="always">\n' +
      '            <name-part name="family" text-case="uppercase"/>\n' +
      '          </name>\n' +
      '        </names>\n' +
      '      </if>\n' +
      '      <else-if variable="editor">\n' +
      '        <names variable="editor">\n' +
      '          <name name-as-sort-order="all" sort-separator=", " delimiter=", " delimiter-precedes-last="always">\n' +
      '            <name-part name="family" text-case="uppercase"/>\n' +
      '          </name>\n' +
      '          <label prefix=". " form="short" plural="contextual" suffix="."/>\n' +
      '        </names>\n' +
      '      </else-if>\n' +
      '    </choose>\n' +
      '  </macro>\n' +
      '  <macro name="contributors-long">\n' +
      '    <choose>\n' +
      '      <if variable="author">\n' +
      '        <names variable="author">\n' +
      '          <name name-as-sort-order="all" initialize-with="." sort-separator=", " delimiter=", " delimiter-precedes-last="always">\n' +
      '            <name-part name="family" text-case="uppercase"/>\n' +
      '          </name>\n' +
      '        </names>\n' +
      '      </if>\n' +
      '      <else-if variable="editor">\n' +
      '        <names variable="editor">\n' +
      '          <name name-as-sort-order="all" initialize-with="." sort-separator=", " delimiter=", " delimiter-precedes-last="always">\n' +
      '            <name-part name="family" text-case="uppercase"/>\n' +
      '          </name>\n' +
      '          <label prefix=". " form="short" plural="contextual" suffix="."/>\n' +
      '        </names>\n' +
      '      </else-if>\n' +
      '    </choose>\n' +
      '  </macro>\n' +
      '  <macro name="contributors-short">\n' +
      '    <choose>\n' +
      '      <if variable="author">\n' +
      '        <names variable="author">\n' +
      '          <name form="short" name-as-sort-order="all" initialize-with="." sort-separator=", " delimiter=", " delimiter-precedes-last="always">\n' +
      '            <name-part name="family" text-case="uppercase"/>\n' +
      '          </name>\n' +
      '        </names>\n' +
      '      </if>\n' +
      '      <else-if variable="editor">\n' +
      '        <names variable="editor">\n' +
      '          <name form="short" name-as-sort-order="all" initialize-with="." sort-separator=", " delimiter=", " delimiter-precedes-last="always">\n' +
      '            <name-part name="family" text-case="uppercase"/>\n' +
      '          </name>\n' +
      '          <label prefix=". " form="short" plural="contextual" suffix="."/>\n' +
      '        </names>\n' +
      '      </else-if>\n' +
      '    </choose>\n' +
      '  </macro>\n' +
      '  <macro name="secondary-contributors">\n' +
      '    <choose>\n' +
      '      <if variable="author" type="book" match="all">\n' +
      '        <names variable="editor translator" delimiter=", ">\n' +
      '          <label form="verb-short" text-case="uppercase"/>\n' +
      '          <name sort-separator=", " delimiter=", " delimiter-precedes-last="always"/>\n' +
      '        </names>\n' +
      '      </if>\n' +
      '    </choose>\n' +
      '  </macro>\n' +
      '  <macro name="container-contributors">\n' +
      '    <choose>\n' +
      '      <if variable="container-author">\n' +
      '        <names variable="container-author">\n' +
      '          <name name-as-sort-order="all" initialize-with="." sort-separator=", " delimiter=", " delimiter-precedes-last="always">\n' +
      '            <name-part name="family" text-case="uppercase"/>\n' +
      '          </name>\n' +
      '        </names>\n' +
      '      </if>\n' +
      '      <else>\n' +
      '        <choose>\n' +
      '          <if type="chapter paper-conference" match="any">\n' +
      '            <names variable="editor">\n' +
      '              <name name-as-sort-order="all" initialize-with="." sort-separator=", " delimiter=", " delimiter-precedes-last="always">\n' +
      '                <name-part name="family" text-case="uppercase"/>\n' +
      '              </name>\n' +
      '              <label prefix=". " form="short" plural="contextual" suffix="."/>\n' +
      '            </names>\n' +
      '          </if>\n' +
      '        </choose>\n' +
      '      </else>\n' +
      '    </choose>\n' +
      '  </macro>\n' +
      '  <macro name="container-contributors-full">\n' +
      '    <choose>\n' +
      '      <if variable="container-author">\n' +
      '        <names variable="container-author">\n' +
      '          <name name-as-sort-order="all" sort-separator=", " delimiter=", " delimiter-precedes-last="always">\n' +
      '            <name-part name="family" text-case="uppercase"/>\n' +
      '          </name>\n' +
      '        </names>\n' +
      '      </if>\n' +
      '      <else>\n' +
      '        <choose>\n' +
      '          <if type="chapter paper-conference" match="any">\n' +
      '            <names variable="editor">\n' +
      '              <name name-as-sort-order="all" sort-separator=", " delimiter=", " delimiter-precedes-last="always">\n' +
      '                <name-part name="family" text-case="uppercase"/>\n' +
      '              </name>\n' +
      '              <label prefix=". " form="short" plural="contextual" suffix="."/>\n' +
      '            </names>\n' +
      '          </if>\n' +
      '        </choose>\n' +
      '      </else>\n' +
      '    </choose>\n' +
      '  </macro>\n' +
      '  <macro name="title-long">\n' +
      '    <group delimiter=". ">\n' +
      '      <text variable="title"/>\n' +
      '      <text macro="secondary-contributors"/>\n' +
      '    </group>\n' +
      '  </macro>\n' +
      '  <macro name="title-short">\n' +
      '    <group delimiter=". ">\n' +
      '      <text variable="title" form="short"/>\n' +
      '    </group>\n' +
      '  </macro>\n' +
      '  <macro name="container">\n' +
      '    <choose>\n' +
      '      <if type="chapter entry entry-dictionary entry-encyclopedia webpage" match="any">\n' +
      '        <text term="in" text-case="capitalize-first" suffix=" "/>\n' +
      '        <text macro="container-contributors" suffix=" "/>\n' +
      '        <choose>\n' +
      '          <if variable="container-title">\n' +
      '            <text variable="container-title" font-style="italic"/>\n' +
      '            <text prefix=" " macro="medium"/>\n' +
      '          </if>\n' +
      '          <else-if variable="volume">\n' +
      '            <text prefix=", " term="volume" form="short" suffix=". "/>\n' +
      '            <text variable="volume"/>\n' +
      '          </else-if>\n' +
      '        </choose>\n' +
      '      </if>\n' +
      '      <else-if type="article-journal article-magazine article-newspaper" match="any">\n' +
      '        <text term="in" text-case="capitalize-first" suffix=" "/>\n' +
      '        <text variable="container-title" font-style="italic"/>\n' +
      '        <text prefix=" " macro="medium"/>\n' +
      '      </else-if>\n' +
      '    </choose>\n' +
      '  </macro>\n' +
      '  <macro name="container-full">\n' +
      '    <choose>\n' +
      '      <if type="chapter entry entry-dictionary entry-encyclopedia webpage" match="any">\n' +
      '        <text term="in" text-case="capitalize-first" suffix=" "/>\n' +
      '        <text macro="container-contributors-full" suffix=" "/>\n' +
      '        <choose>\n' +
      '          <if variable="container-title">\n' +
      '            <text variable="container-title" font-style="italic"/>\n' +
      '            <text prefix=" " macro="medium"/>\n' +
      '          </if>\n' +
      '          <else-if variable="volume">\n' +
      '            <text prefix=", " term="volume" form="short" suffix=". "/>\n' +
      '            <text variable="volume"/>\n' +
      '          </else-if>\n' +
      '        </choose>\n' +
      '      </if>\n' +
      '      <else-if type="article-journal article-magazine article-newspaper" match="any">\n' +
      '        <text term="in" text-case="capitalize-first" suffix=" "/>\n' +
      '        <text variable="container-title" font-style="italic"/>\n' +
      '        <text prefix=" " macro="medium"/>\n' +
      '      </else-if>\n' +
      '    </choose>\n' +
      '  </macro>\n' +
      '  <macro name="edition">\n' +
      '    <choose>\n' +
      '      <if variable="edition">\n' +
      '        <text variable="edition" suffix="."/>\n' +
      '        <text prefix=" " term="edition" form="short" suffix="."/>\n' +
      '      </if>\n' +
      '    </choose>\n' +
      '  </macro>\n' +
      '  <macro name="publisher-place">\n' +
      '    <group delimiter="; ">\n' +
      '      <choose>\n' +
      '        <if variable="publisher-place accessed DOI URL" match="any">\n' +
      '          <text variable="publisher-place"/>\n' +
      '        </if>\n' +
      '        <else>\n' +
      '          <text value="[s.l.]"/>\n' +
      '        </else>\n' +
      '      </choose>\n' +
      '    </group>\n' +
      '  </macro>\n' +
      '  <macro name="printers">\n' +
      '    <group delimiter="; ">\n' +
      '      <choose>\n' +
      '        <if variable="publisher accessed DOI URL" match="any">\n' +
      '          <text variable="publisher"/>\n' +
      '        </if>\n' +
      '        <else>\n' +
      '          <text value="[s.n.]"/>\n' +
      '        </else>\n' +
      '      </choose>\n' +
      '    </group>\n' +
      '  </macro>\n' +
      '  <macro name="publisher">\n' +
      '    <group delimiter=": ">\n' +
      '      <text macro="publisher-place"/>\n' +
      '      <text macro="printers"/>\n' +
      '    </group>\n' +
      '  </macro>\n' +
      '  <macro name="issued">\n' +
      '    <choose>\n' +
      '      <if type="book chapter paper-conference" match="any">\n' +
      '        <text prefix=" " macro="publisher" suffix=", "/>\n' +
      '        <date variable="issued">\n' +
      '          <date-part name="year" range-delimiter=" &#8211; "/>\n' +
      '        </date>\n' +
      '      </if>\n' +
      '      <else-if type="article-journal article-magazine article-newspaper" match="any">\n' +
      '        <date variable="issued">\n' +
      '          <date-part name="year" range-delimiter=" &#8211; "/>\n' +
      '        </date>\n' +
      '        <choose>\n' +
      '          <if variable="volume">\n' +
      '            <text prefix=", " term="volume" form="short" suffix=". "/>\n' +
      '            <text variable="volume"/>\n' +
      '          </if>\n' +
      '        </choose>\n' +
      '        <choose>\n' +
      '          <if variable="issue">\n' +
      '            <text prefix=", " term="issue" form="short" suffix=". "/>\n' +
      '            <text variable="issue"/>\n' +
      '          </if>\n' +
      '        </choose>\n' +
      '      </else-if>\n' +
      '    </choose>\n' +
      '  </macro>\n' +
      '  <macro name="citation-locator">\n' +
      '    <label variable="locator" form="short" suffix=". "/>\n' +
      '    <text variable="locator"/>\n' +
      '  </macro>\n' +
      '  <macro name="collection">\n' +
      '    <text variable="collection-title"/>\n' +
      '    <text prefix=" " variable="collection-number"/>\n' +
      '    <choose>\n' +
      '      <if variable="collection-editor">\n' +
      '        <text prefix=", " term="editor" form="verb-short" text-case="uppercase" suffix=" "/>\n' +
      '      </if>\n' +
      '    </choose>\n' +
      '  </macro>\n' +
      '  <macro name="ISBN">\n' +
      '    <choose>\n' +
      '      <if variable="ISBN">\n' +
      '        <text variable="ISBN" prefix="ISBN "/>\n' +
      '      </if>\n' +
      '    </choose>\n' +
      '  </macro>\n' +
      '  <macro name="ISSN">\n' +
      '    <choose>\n' +
      '      <if variable="ISSN">\n' +
      '        <text variable="ISSN" prefix="ISSN "/>\n' +
      '      </if>\n' +
      '    </choose>\n' +
      '  </macro>\n' +
      '  <macro name="identifier">\n' +
      '    <group delimiter="; ">\n' +
      '      <choose>\n' +
      '        <if variable="DOI">\n' +
      '          <text variable="DOI" prefix="DOI: "/>\n' +
      '        </if>\n' +
      '        <else>\n' +
      '          <text variable="URL" prefix="Dostupné na internete: "/>\n' +
      '        </else>\n' +
      '      </choose>\n' +
      '    </group>\n' +
      '  </macro>\n' +
      '  <macro name="medium">\n' +
      '    <choose>\n' +
      '      <if variable="accessed DOI URL" match="any">\n' +
      '        <text term="online" prefix="[" suffix="]"/>\n' +
      '      </if>\n' +
      '      <else>\n' +
      '        <text variable="archive" prefix="[" suffix="]"/>\n' +
      '      </else>\n' +
      '    </choose>\n' +
      '  </macro>\n' +
      '  <macro name="quoted">\n' +
      '    <group prefix="[cit. " suffix="]">\n' +
      '      <date variable="accessed">\n' +
      '        <date-part name="day" suffix="." form="numeric-leading-zeros"/>\n' +
      '        <date-part name="month" suffix="." form="numeric-leading-zeros"/>\n' +
      '        <date-part name="year"/>\n' +
      '      </date>\n' +
      '    </group>\n' +
      '  </macro>\n' +
      '  <citation et-al-min="4" et-al-use-first="1" disambiguate-add-names="true">\n' +
      '    <layout delimiter="; ">\n' +
      '      <choose>\n' +
      '        <if position="subsequent">\n' +
      '          <text macro="contributors-short" suffix=", "/>\n' +
      '          <text macro="title-short"/>\n' +
      '          <choose>\n' +
      '            <if variable="locator">\n' +
      '              <text prefix=", " macro="citation-locator" suffix="."/>\n' +
      '            </if>\n' +
      '            <else-if variable="accessed URL DOI" match="any">\n' +
      '              <text term="online" prefix=" [" suffix="] "/>\n' +
      '              <text macro="quoted"/>\n' +
      '              <text prefix=". " macro="identifier"/>\n' +
      '            </else-if>\n' +
      '          </choose>\n' +
      '        </if>\n' +
      '        <else>\n' +
      '          <choose>\n' +
      '            <if type="book thesis manuscript report" match="any">\n' +
      '              <text macro="contributors-long" suffix=". "/>\n' +
      '              <text macro="title-long" font-style="italic"/>\n' +
      '              <choose>\n' +
      '                <if variable="accessed DOI URL" match="any">\n' +
      '                  <text prefix=" " macro="medium"/>\n' +
      '                  <text prefix=". " macro="issued"/>\n' +
      '                  <text prefix=", " macro="citation-locator"/>\n' +
      '                  <text prefix=" " macro="quoted"/>\n' +
      '                  <text prefix=". " macro="identifier"/>\n' +
      '                </if>\n' +
      '                <else-if variable="issued" match="none">\n' +
      '                  <text prefix=" " macro="medium"/>\n' +
      '                  <choose>\n' +
      '                    <if variable="publisher publisher-place" match="any">\n' +
      '                      <text prefix=". " macro="publisher"/>\n' +
      '                    </if>\n' +
      '                  </choose>\n' +
      '                  <text prefix=", " macro="citation-locator" suffix="."/>\n' +
      '                </else-if>\n' +
      '                <else>\n' +
      '                  <text prefix=" " macro="medium"/>\n' +
      '                  <text prefix=". " macro="issued"/>\n' +
      '                  <text prefix=", " macro="citation-locator" suffix="."/>\n' +
      '                </else>\n' +
      '              </choose>\n' +
      '            </if>\n' +
      '            <else-if type="chapter entry entry-dictionary entry-encyclopedia" match="any">\n' +
      '              <text macro="contributors-long" suffix=". "/>\n' +
      '              <text macro="title-long" suffix=". "/>\n' +
      '              <text macro="container"/>\n' +
      '              <choose>\n' +
      '                <if variable="accessed DOI URL" match="any">\n' +
      '                  <text prefix=". " macro="issued"/>\n' +
      '                  <text prefix=", zv. " variable="volume"/>\n' +
      '                  <text prefix=", " macro="citation-locator"/>\n' +
      '                  <text prefix=" " macro="quoted"/>\n' +
      '                  <text prefix=". " macro="identifier"/>\n' +
      '                </if>\n' +
      '                <else-if variable="issued" match="none">\n' +
      '                  <choose>\n' +
      '                    <if variable="publisher publisher-place" match="any">\n' +
      '                      <text prefix=". " macro="publisher"/>\n' +
      '                    </if>\n' +
      '                  </choose>\n' +
      '                  <text prefix=", " macro="citation-locator" suffix="."/>\n' +
      '                </else-if>\n' +
      '                <else>\n' +
      '                  <text prefix=". " macro="issued"/>\n' +
      '                  <text prefix=", zv. " variable="volume"/>\n' +
      '                  <text prefix=", " macro="citation-locator" suffix="."/>\n' +
      '                </else>\n' +
      '              </choose>\n' +
      '            </else-if>\n' +
      '            <else-if type="article-journal article-magazine article-newspaper webpage" match="any">\n' +
      '              <text macro="contributors-long" suffix=". "/>\n' +
      '              <text macro="title-long" suffix=". "/>\n' +
      '              <text macro="container"/>\n' +
      '              <choose>\n' +
      '                <if variable="accessed DOI URL" match="any">\n' +
      '                  <text prefix=". " macro="issued"/>\n' +
      '                  <text prefix=", " macro="citation-locator"/>\n' +
      '                  <text prefix=" " macro="quoted"/>\n' +
      '                  <text prefix=". " macro="identifier"/>\n' +
      '                </if>\n' +
      '                <else>\n' +
      '                  <text prefix=". " macro="issued"/>\n' +
      '                  <text prefix=", " macro="citation-locator" suffix="."/>\n' +
      '                </else>\n' +
      '              </choose>\n' +
      '            </else-if>\n' +
      '          </choose>\n' +
      '        </else>\n' +
      '      </choose>\n' +
      '    </layout>\n' +
      '  </citation>\n' +
      '  <bibliography et-al-min="4" et-al-use-first="1">\n' +
      '    <sort>\n' +
      '      <key macro="contributors-full" names-min="3" names-use-first="3"/>\n' +
      '      <key macro="title-long"/>\n' +
      '    </sort>\n' +
      '    <layout>\n' +
      '      <choose>\n' +
      '        <if type="book thesis manuscript report" match="any">\n' +
      '          <text macro="contributors-full" suffix=". "/>\n' +
      '          <text macro="title-long" font-style="italic"/>\n' +
      '          <choose>\n' +
      '            <if variable="accessed DOI URL" match="any">\n' +
      '              <text prefix=" " macro="medium"/>\n' +
      '              <text prefix=". " macro="secondary-contributors"/>\n' +
      '              <text prefix=". " macro="edition" suffix="."/>\n' +
      '              <text prefix=". " macro="issued"/>\n' +
      '              <text prefix=" " macro="quoted" suffix="."/>\n' +
      '              <text prefix=". " macro="collection" suffix="."/>\n' +
      '              <text prefix=". " variable="note" suffix="."/>\n' +
      '              <text prefix=". " macro="ISBN" suffix="."/>\n' +
      '              <text prefix=". " macro="identifier"/>\n' +
      '            </if>\n' +
      '            <else-if variable="issued" match="none">\n' +
      '              <text prefix=" " macro="medium" suffix="."/>\n' +
      '              <choose>\n' +
      '                <if variable="publisher publisher-place" match="any">\n' +
      '                  <text prefix=". " macro="publisher" suffix="."/>\n' +
      '                </if>\n' +
      '              </choose>\n' +
      '              <text prefix=". " macro="collection" suffix="."/>\n' +
      '              <text prefix=". " variable="note" suffix="."/>\n' +
      '              <text prefix=". " macro="ISBN" suffix="."/>\n' +
      '            </else-if>\n' +
      '            <else>\n' +
      '              <text prefix=" " macro="medium" suffix="."/>\n' +
      '              <text prefix=". " macro="edition" suffix="."/>\n' +
      '              <text prefix=". " macro="issued" suffix="."/>\n' +
      '              <text prefix=". " macro="collection" suffix="."/>\n' +
      '              <text prefix=". " variable="note" suffix="."/>\n' +
      '              <text prefix=". " macro="ISBN" suffix="."/>\n' +
      '            </else>\n' +
      '          </choose>\n' +
      '        </if>\n' +
      '        <else-if type="chapter entry entry-dictionary entry-encyclopedia" match="any">\n' +
      '          <text macro="contributors-full" suffix=". "/>\n' +
      '          <text macro="title-long" suffix=". "/>\n' +
      '          <text macro="container-full"/>\n' +
      '          <choose>\n' +
      '            <if variable="accessed DOI URL" match="any">\n' +
      '              <text prefix=". " macro="edition"/>\n' +
      '              <text prefix=". " macro="issued"/>\n' +
      '              <text prefix=", zv. " variable="volume"/>\n' +
      '              <text prefix=", s. " variable="page"/>\n' +
      '              <text prefix=" " macro="quoted"/>\n' +
      '              <text prefix=". " macro="collection" suffix="."/>\n' +
      '              <text prefix=". " macro="ISBN" suffix="."/>\n' +
      '              <text prefix=". " macro="identifier"/>\n' +
      '            </if>\n' +
      '            <else-if variable="issued" match="none">\n' +
      '              <text prefix=". " macro="edition" suffix="."/>\n' +
      '              <choose>\n' +
      '                <if variable="publisher publisher-place" match="any">\n' +
      '                  <text prefix=". " macro="publisher"/>\n' +
      '                </if>\n' +
      '              </choose>\n' +
      '              <text prefix=". " macro="collection" suffix="."/>\n' +
      '              <text prefix=". " variable="note" suffix="."/>\n' +
      '              <text prefix=", zv. " variable="volume"/>\n' +
      '              <text prefix=", s. " variable="page"/>\n' +
      '              <text prefix=" " macro="quoted"/>\n' +
      '              <text prefix=". " macro="collection" suffix="."/>\n' +
      '              <text prefix=". " macro="ISBN" suffix="."/>\n' +
      '            </else-if>\n' +
      '            <else>\n' +
      '              <text prefix=". " macro="edition"/>\n' +
      '              <text prefix=". " macro="issued"/>\n' +
      '              <text prefix=", zv. " variable="volume"/>\n' +
      '              <text prefix=", s. " variable="page" suffix="."/>\n' +
      '              <text prefix=". " macro="collection" suffix="."/>\n' +
      '              <text prefix=". " macro="ISBN" suffix="."/>\n' +
      '            </else>\n' +
      '          </choose>\n' +
      '        </else-if>\n' +
      '        <else-if type="article-journal article-magazine article-newspaper webpage" match="any">\n' +
      '          <text macro="contributors-full" suffix=". "/>\n' +
      '          <text macro="title-long" suffix=". "/>\n' +
      '          <text macro="container-full"/>\n' +
      '          <text prefix=". " macro="issued"/>\n' +
      '          <choose>\n' +
      '            <if variable="accessed DOI URL" match="any">\n' +
      '              <text prefix=", s. " variable="page"/>\n' +
      '              <text prefix=" " macro="quoted"/>\n' +
      '              <text prefix=". " variable="note" suffix="."/>\n' +
      '              <text prefix=". " macro="ISSN" suffix="."/>\n' +
      '              <text prefix=". " macro="identifier"/>\n' +
      '            </if>\n' +
      '            <else>\n' +
      '              <text prefix=", s. " variable="page" suffix="."/>\n' +
      '              <text prefix=". " variable="note" suffix="."/>\n' +
      '              <text prefix=". " macro="ISSN" suffix="."/>\n' +
      '            </else>\n' +
      '          </choose>\n' +
      '        </else-if>\n' +
      '      </choose>\n' +
      '    </layout>\n' +
      '  </bibliography>\n' +
      '</style>';
  }
  getChicagoTemplate() {
    return '<?xml version="1.0" encoding="utf-8"?>\n' +
      '<style xmlns="http://purl.org/net/xbiblio/csl" class="in-text" version="1.0" demote-non-dropping-particle="display-and-sort" page-range-format="chicago">\n' +
      '  <info>\n' +
      '    <title>Chicago Manual of Style 17th edition (author-date)</title>\n' +
      '    <id>http://www.zotero.org/styles/chicago-author-date</id>\n' +
      '    <link href="http://www.zotero.org/styles/chicago-author-date" rel="self"/>\n' +
      '    <link href="http://www.chicagomanualofstyle.org/tools_citationguide.html" rel="documentation"/>\n' +
      '    <author>\n' +
      '      <name>Julian Onions</name>\n' +
      '      <email>julian.onions@gmail.com</email>\n' +
      '    </author>\n' +
      '    <contributor>\n' +
      '      <name>Sebastian Karcher</name>\n' +
      '    </contributor>\n' +
      '    <contributor>\n' +
      '      <name>Richard Karnesky</name>\n' +
      '      <email>karnesky+zotero@gmail.com</email>\n' +
      '      <uri>http://arc.nucapt.northwestern.edu/Richard_Karnesky</uri>\n' +
      '    </contributor>\n' +
      '    <contributor>\n' +
      '      <name>Andrew Dunning</name>\n' +
      '      <uri>https://orcid.org/0000-0003-0464-5036</uri>\n' +
      '    </contributor>\n' +
      '    <contributor>\n' +
      '      <name>Matthew Roth</name>\n' +
      '      <email>matthew.g.roth@yale.edu</email>\n' +
      '      <uri> https://orcid.org/0000-0001-7902-6331</uri>\n' +
      '    </contributor>\n' +
      '    <contributor>\n' +
      '      <name>Brenton M. Wiernik</name>\n' +
      '    </contributor>\n' +
      '    <contributor>\n' +
      '      <name>Zeping Lee</name>\n' +
      '      <email>zepinglee@gmail.com</email>\n' +
      '    </contributor>\n' +
      '    <category citation-format="author-date"/>\n' +
      '    <category field="generic-base"/>\n' +
      '    <summary>The author-date variant of the Chicago style</summary>\n' +
      '    <updated>2024-05-09T13:08:37+00:00</updated>\n' +
      '    <rights license="http://creativecommons.org/licenses/by-sa/3.0/">This work is licensed under a Creative Commons Attribution-ShareAlike 3.0 License</rights>\n' +
      '  </info>\n' +
      '  <locale xml:lang="en">\n' +
      '    <terms>\n' +
      '      <term name="editor" form="verb-short">ed.</term>\n' +
      '      <term name="container-author" form="verb">by</term>\n' +
      '      <term name="translator" form="verb-short">trans.</term>\n' +
      '      <term name="editortranslator" form="verb">edited and translated by</term>\n' +
      '      <term name="translator" form="short">trans.</term>\n' +
      '    </terms>\n' +
      '  </locale>\n' +
      '  <locale xml:lang="pt-PT">\n' +
      '    <terms>\n' +
      '      <term name="accessed">acedido a</term>\n' +
      '    </terms>\n' +
      '  </locale>\n' +
      '  <locale xml:lang="pt">\n' +
      '    <terms>\n' +
      '      <term name="editor" form="verb">editado por</term>\n' +
      '      <term name="editor" form="verb-short">ed.</term>\n' +
      '      <term name="container-author" form="verb">por</term>\n' +
      '      <term name="translator" form="verb-short">traduzido por</term>\n' +
      '      <term name="translator" form="short">trad.</term>\n' +
      '      <term name="editortranslator" form="verb">editado e traduzido por</term>\n' +
      '      <term name="and">e</term>\n' +
      '      <term name="no date" form="long">s.d</term>\n' +
      '      <term name="no date" form="short">s.d.</term>\n' +
      '      <term name="in">em</term>\n' +
      '      <term name="at">em</term>\n' +
      '      <term name="by">por</term>\n' +
      '    </terms>\n' +
      '  </locale>\n' +
      '  <macro name="secondary-contributors">\n' +
      '    <choose>\n' +
      '      <if type="chapter entry-dictionary entry-encyclopedia paper-conference" match="none">\n' +
      '        <group delimiter=". ">\n' +
      '          <names variable="editor translator" delimiter=". ">\n' +
      '            <label form="verb" text-case="capitalize-first" suffix=" "/>\n' +
      '            <name and="text" delimiter=", "/>\n' +
      '          </names>\n' +
      '          <names variable="director" delimiter=". ">\n' +
      '            <label form="verb" text-case="capitalize-first" suffix=" "/>\n' +
      '            <name and="text" delimiter=", "/>\n' +
      '          </names>\n' +
      '        </group>\n' +
      '      </if>\n' +
      '    </choose>\n' +
      '  </macro>\n' +
      '  <macro name="container-contributors">\n' +
      '    <choose>\n' +
      '      <if type="chapter entry-dictionary entry-encyclopedia paper-conference" match="any">\n' +
      '        <group prefix=", " delimiter=", ">\n' +
      '          <names variable="container-author" delimiter=", ">\n' +
      '            <label form="verb" suffix=" "/>\n' +
      '            <name and="text" delimiter=", "/>\n' +
      '          </names>\n' +
      '          <names variable="editor translator" delimiter=", ">\n' +
      '            <label form="verb" suffix=" "/>\n' +
      '            <name and="text" delimiter=", "/>\n' +
      '          </names>\n' +
      '        </group>\n' +
      '      </if>\n' +
      '    </choose>\n' +
      '  </macro>\n' +
      '  <macro name="editor">\n' +
      '    <names variable="editor">\n' +
      '      <name name-as-sort-order="first" and="text" sort-separator=", " delimiter=", " delimiter-precedes-last="always"/>\n' +
      '      <label form="short" prefix=", "/>\n' +
      '    </names>\n' +
      '  </macro>\n' +
      '  <macro name="translator">\n' +
      '    <names variable="translator">\n' +
      '      <name name-as-sort-order="first" and="text" sort-separator=", " delimiter=", " delimiter-precedes-last="always"/>\n' +
      '      <label form="short" prefix=", "/>\n' +
      '    </names>\n' +
      '  </macro>\n' +
      '  <macro name="recipient">\n' +
      '    <choose>\n' +
      '      <if type="personal_communication">\n' +
      '        <choose>\n' +
      '          <if variable="genre">\n' +
      '            <text variable="genre" text-case="capitalize-first"/>\n' +
      '          </if>\n' +
      '          <else>\n' +
      '            <text term="letter" text-case="capitalize-first"/>\n' +
      '          </else>\n' +
      '        </choose>\n' +
      '      </if>\n' +
      '    </choose>\n' +
      '    <names variable="recipient" delimiter=", ">\n' +
      '      <label form="verb" prefix=" " text-case="lowercase" suffix=" "/>\n' +
      '      <name and="text" delimiter=", "/>\n' +
      '    </names>\n' +
      '  </macro>\n' +
      '  <macro name="substitute-title">\n' +
      '    <choose>\n' +
      '      <if type="article-magazine article-newspaper review review-book" match="any">\n' +
      '        <text macro="container-title"/>\n' +
      '      </if>\n' +
      '    </choose>\n' +
      '  </macro>\n' +
      '  <macro name="contributors">\n' +
      '    <group delimiter=". ">\n' +
      '      <names variable="author">\n' +
      '        <name and="text" name-as-sort-order="first" sort-separator=", " delimiter=", " delimiter-precedes-last="always"/>\n' +
      '        <label form="short" prefix=", "/>\n' +
      '        <substitute>\n' +
      '          <names variable="editor"/>\n' +
      '          <names variable="translator"/>\n' +
      '          <names variable="director"/>\n' +
      '          <text macro="substitute-title"/>\n' +
      '          <text macro="title"/>\n' +
      '        </substitute>\n' +
      '      </names>\n' +
      '      <text macro="recipient"/>\n' +
      '    </group>\n' +
      '  </macro>\n' +
      '  <macro name="contributors-short">\n' +
      '    <names variable="author">\n' +
      '      <name form="short" and="text" delimiter=", " initialize-with=". "/>\n' +
      '      <substitute>\n' +
      '        <names variable="editor"/>\n' +
      '        <names variable="translator"/>\n' +
      '        <names variable="director"/>\n' +
      '        <text macro="substitute-title"/>\n' +
      '        <text macro="title"/>\n' +
      '      </substitute>\n' +
      '    </names>\n' +
      '  </macro>\n' +
      '  <macro name="interviewer">\n' +
      '    <names variable="interviewer" delimiter=", ">\n' +
      '      <label form="verb" prefix=" " text-case="capitalize-first" suffix=" "/>\n' +
      '      <name and="text" delimiter=", "/>\n' +
      '    </names>\n' +
      '  </macro>\n' +
      '  <macro name="archive">\n' +
      '    <group delimiter=". ">\n' +
      '      <text variable="archive_location" text-case="capitalize-first"/>\n' +
      '      <text variable="archive"/>\n' +
      '      <text variable="archive-place"/>\n' +
      '    </group>\n' +
      '  </macro>\n' +
      '  <macro name="access">\n' +
      '    <group delimiter=". ">\n' +
      '      <choose>\n' +
      '        <if type="graphic report" match="any">\n' +
      '          <text macro="archive"/>\n' +
      '        </if>\n' +
      '        <else-if type="article-journal bill book chapter legal_case legislation motion_picture paper-conference" match="none">\n' +
      '          <text macro="archive"/>\n' +
      '        </else-if>\n' +
      '      </choose>\n' +
      '      <choose>\n' +
      '        <if type="webpage post-weblog" match="any">\n' +
      '          <date variable="issued" form="text"/>\n' +
      '        </if>\n' +
      '      </choose>\n' +
      '      <choose>\n' +
      '        <if variable="issued" match="none">\n' +
      '          <group delimiter=" ">\n' +
      '            <text term="accessed" text-case="capitalize-first"/>\n' +
      '            <date variable="accessed" form="text"/>\n' +
      '          </group>\n' +
      '        </if>\n' +
      '      </choose>\n' +
      '      <choose>\n' +
      '        <if type="legal_case" match="none">\n' +
      '          <choose>\n' +
      '            <if variable="DOI">\n' +
      '              <text variable="DOI" prefix="https://doi.org/"/>\n' +
      '            </if>\n' +
      '            <else>\n' +
      '              <text variable="URL"/>\n' +
      '            </else>\n' +
      '          </choose>\n' +
      '        </if>\n' +
      '      </choose>\n' +
      '    </group>\n' +
      '  </macro>\n' +
      '  <macro name="title">\n' +
      '    <choose>\n' +
      '      <if variable="title" match="none">\n' +
      '        <choose>\n' +
      '          <if type="personal_communication speech thesis" match="none">\n' +
      '            <text variable="genre" text-case="capitalize-first"/>\n' +
      '          </if>\n' +
      '        </choose>\n' +
      '      </if>\n' +
      '      <else-if type="bill book graphic legislation motion_picture song" match="any">\n' +
      '        <text variable="title" text-case="title" font-style="italic"/>\n' +
      '        <group prefix=" (" suffix=")" delimiter=" ">\n' +
      '          <text term="version"/>\n' +
      '          <text variable="version"/>\n' +
      '        </group>\n' +
      '      </else-if>\n' +
      '      <else-if variable="reviewed-author">\n' +
      '        <choose>\n' +
      '          <if variable="reviewed-title">\n' +
      '            <group delimiter=". ">\n' +
      '              <text variable="title" text-case="title" quotes="true"/>\n' +
      '              <group delimiter=", ">\n' +
      '                <text variable="reviewed-title" text-case="title" font-style="italic" prefix="Review of "/>\n' +
      '                <names variable="reviewed-author">\n' +
      '                  <label form="verb-short" text-case="lowercase" suffix=" "/>\n' +
      '                  <name and="text" delimiter=", "/>\n' +
      '                </names>\n' +
      '              </group>\n' +
      '            </group>\n' +
      '          </if>\n' +
      '          <else>\n' +
      '            <group delimiter=", ">\n' +
      '              <text variable="title" text-case="title" font-style="italic" prefix="Review of "/>\n' +
      '              <names variable="reviewed-author">\n' +
      '                <label form="verb-short" text-case="lowercase" suffix=" "/>\n' +
      '                <name and="text" delimiter=", "/>\n' +
      '              </names>\n' +
      '            </group>\n' +
      '          </else>\n' +
      '        </choose>\n' +
      '      </else-if>\n' +
      '      <else-if type="legal_case interview patent" match="any">\n' +
      '        <text variable="title"/>\n' +
      '      </else-if>\n' +
      '      <else>\n' +
      '        <text variable="title" text-case="title" quotes="true"/>\n' +
      '      </else>\n' +
      '    </choose>\n' +
      '  </macro>\n' +
      '  <macro name="edition">\n' +
      '    <choose>\n' +
      '      <if type="bill book graphic legal_case legislation motion_picture report song" match="any">\n' +
      '        <choose>\n' +
      '          <if is-numeric="edition">\n' +
      '            <group delimiter=" " prefix=". ">\n' +
      '              <number variable="edition" form="ordinal"/>\n' +
      '              <text term="edition" form="short" strip-periods="true"/>\n' +
      '            </group>\n' +
      '          </if>\n' +
      '          <else>\n' +
      '            <text variable="edition" text-case="capitalize-first" prefix=". "/>\n' +
      '          </else>\n' +
      '        </choose>\n' +
      '      </if>\n' +
      '      <else-if type="chapter entry-dictionary entry-encyclopedia paper-conference" match="any">\n' +
      '        <choose>\n' +
      '          <if is-numeric="edition">\n' +
      '            <group delimiter=" " prefix=", ">\n' +
      '              <number variable="edition" form="ordinal"/>\n' +
      '              <text term="edition" form="short"/>\n' +
      '            </group>\n' +
      '          </if>\n' +
      '          <else>\n' +
      '            <text variable="edition" prefix=", "/>\n' +
      '          </else>\n' +
      '        </choose>\n' +
      '      </else-if>\n' +
      '    </choose>\n' +
      '  </macro>\n' +
      '  <macro name="locators">\n' +
      '    <choose>\n' +
      '      <if type="article-journal">\n' +
      '        <choose>\n' +
      '          <if variable="volume">\n' +
      '            <text variable="volume" prefix=" "/>\n' +
      '            <group prefix=" (" suffix=")">\n' +
      '              <choose>\n' +
      '                <if variable="issue">\n' +
      '                  <text variable="issue"/>\n' +
      '                </if>\n' +
      '                <else>\n' +
      '                  <date variable="issued">\n' +
      '                    <date-part name="month"/>\n' +
      '                  </date>\n' +
      '                </else>\n' +
      '              </choose>\n' +
      '            </group>\n' +
      '          </if>\n' +
      '          <else-if variable="issue">\n' +
      '            <group delimiter=" " prefix=", ">\n' +
      '              <text term="issue" form="short"/>\n' +
      '              <text variable="issue"/>\n' +
      '              <date variable="issued" prefix="(" suffix=")">\n' +
      '                <date-part name="month"/>\n' +
      '              </date>\n' +
      '            </group>\n' +
      '          </else-if>\n' +
      '          <else>\n' +
      '            <date variable="issued" prefix=", ">\n' +
      '              <date-part name="month"/>\n' +
      '            </date>\n' +
      '          </else>\n' +
      '        </choose>\n' +
      '      </if>\n' +
      '      <else-if type="legal_case">\n' +
      '        <text variable="volume" prefix=", "/>\n' +
      '        <text variable="container-title" prefix=" "/>\n' +
      '        <text variable="page" prefix=" "/>\n' +
      '      </else-if>\n' +
      '      <else-if type="bill book graphic legal_case legislation motion_picture report song" match="any">\n' +
      '        <group prefix=". " delimiter=". ">\n' +
      '          <group>\n' +
      '            <text term="volume" form="short" text-case="capitalize-first" suffix=" "/>\n' +
      '            <number variable="volume" form="numeric"/>\n' +
      '          </group>\n' +
      '          <group>\n' +
      '            <number variable="number-of-volumes" form="numeric"/>\n' +
      '            <text term="volume" form="short" prefix=" " plural="true"/>\n' +
      '          </group>\n' +
      '        </group>\n' +
      '      </else-if>\n' +
      '      <else-if type="chapter entry-dictionary entry-encyclopedia paper-conference" match="any">\n' +
      '        <choose>\n' +
      '          <if variable="page" match="none">\n' +
      '            <group prefix=". ">\n' +
      '              <text term="volume" form="short" text-case="capitalize-first" suffix=" "/>\n' +
      '              <number variable="volume" form="numeric"/>\n' +
      '            </group>\n' +
      '          </if>\n' +
      '        </choose>\n' +
      '      </else-if>\n' +
      '    </choose>\n' +
      '  </macro>\n' +
      '  <macro name="locators-chapter">\n' +
      '    <choose>\n' +
      '      <if type="chapter entry-dictionary entry-encyclopedia paper-conference" match="any">\n' +
      '        <choose>\n' +
      '          <if variable="page">\n' +
      '            <group prefix=", ">\n' +
      '              <text variable="volume" suffix=":"/>\n' +
      '              <text variable="page"/>\n' +
      '            </group>\n' +
      '          </if>\n' +
      '        </choose>\n' +
      '      </if>\n' +
      '    </choose>\n' +
      '  </macro>\n' +
      '  <macro name="locators-article">\n' +
      '    <choose>\n' +
      '      <if type="article-newspaper">\n' +
      '        <group prefix=", " delimiter=", ">\n' +
      '          <group delimiter=" ">\n' +
      '            <text variable="edition"/>\n' +
      '            <text term="edition"/>\n' +
      '          </group>\n' +
      '          <group>\n' +
      '            <text term="section" form="short" suffix=" "/>\n' +
      '            <text variable="section"/>\n' +
      '          </group>\n' +
      '        </group>\n' +
      '      </if>\n' +
      '      <else-if type="article-journal">\n' +
      '        <choose>\n' +
      '          <if variable="volume">\n' +
      '            <choose>\n' +
      '              <if variable="issue">\n' +
      '                <text variable="page" prefix=": "/>\n' +
      '              </if>\n' +
      '              <else>\n' +
      '                <!-- CMoS 15.48: If the month or season is included, it is\n' +
      '                  enclosed in parentheses, and a space follows the colon.\n' +
      '                  Unfortunately we can\'t check the month in CSL v1.0.2.\n' +
      '                -->\n' +
      '                <text variable="page" prefix=":"/>\n' +
      '              </else>\n' +
      '            </choose>\n' +
      '          </if>\n' +
      '          <else>\n' +
      '            <text variable="page" prefix=", "/>\n' +
      '          </else>\n' +
      '        </choose>\n' +
      '      </else-if>\n' +
      '    </choose>\n' +
      '  </macro>\n' +
      '  <macro name="point-locators">\n' +
      '    <choose>\n' +
      '      <if variable="locator">\n' +
      '        <choose>\n' +
      '          <if locator="page" match="none">\n' +
      '            <choose>\n' +
      '              <if type="bill book graphic legal_case legislation motion_picture report song" match="any">\n' +
      '                <choose>\n' +
      '                  <if variable="volume">\n' +
      '                    <group>\n' +
      '                      <text term="volume" form="short" suffix=" "/>\n' +
      '                      <number variable="volume" form="numeric"/>\n' +
      '                      <label variable="locator" form="short" prefix=", " suffix=" "/>\n' +
      '                    </group>\n' +
      '                  </if>\n' +
      '                  <else>\n' +
      '                    <label variable="locator" form="short" suffix=" "/>\n' +
      '                  </else>\n' +
      '                </choose>\n' +
      '              </if>\n' +
      '              <else>\n' +
      '                <label variable="locator" form="short" suffix=" "/>\n' +
      '              </else>\n' +
      '            </choose>\n' +
      '          </if>\n' +
      '          <else-if type="bill book graphic legal_case legislation motion_picture report song" match="any">\n' +
      '            <number variable="volume" form="numeric" suffix=":"/>\n' +
      '          </else-if>\n' +
      '        </choose>\n' +
      '        <text variable="locator"/>\n' +
      '      </if>\n' +
      '    </choose>\n' +
      '  </macro>\n' +
      '  <macro name="container-prefix">\n' +
      '    <text term="in" text-case="capitalize-first"/>\n' +
      '  </macro>\n' +
      '  <macro name="container-title">\n' +
      '    <choose>\n' +
      '      <if type="chapter entry-dictionary entry-encyclopedia paper-conference" match="any">\n' +
      '        <text macro="container-prefix" suffix=" "/>\n' +
      '      </if>\n' +
      '    </choose>\n' +
      '    <choose>\n' +
      '      <if type="webpage">\n' +
      '        <text variable="container-title" text-case="title"/>\n' +
      '      </if>\n' +
      '      <else-if type="legal_case" match="none">\n' +
      '        <group delimiter=" ">\n' +
      '          <text variable="container-title" text-case="title" font-style="italic"/>\n' +
      '          <choose>\n' +
      '            <if type="post-weblog">\n' +
      '              <text value="(blog)"/>\n' +
      '            </if>\n' +
      '          </choose>\n' +
      '        </group>\n' +
      '      </else-if>\n' +
      '    </choose>\n' +
      '  </macro>\n' +
      '  <macro name="publisher">\n' +
      '    <group delimiter=": ">\n' +
      '      <text variable="publisher-place"/>\n' +
      '      <text variable="publisher"/>\n' +
      '    </group>\n' +
      '  </macro>\n' +
      '  <macro name="date">\n' +
      '    <choose>\n' +
      '      <if variable="issued">\n' +
      '        <group delimiter=" ">\n' +
      '          <date variable="original-date" form="text" date-parts="year" prefix="(" suffix=")"/>\n' +
      '          <date variable="issued">\n' +
      '            <date-part name="year"/>\n' +
      '          </date>\n' +
      '        </group>\n' +
      '        <text variable="year-suffix"/>\n' +
      '      </if>\n' +
      '      <else-if variable="status">\n' +
      '        <text variable="status" text-case="capitalize-first"/>\n' +
      '        <text variable="year-suffix" prefix="-"/>\n' +
      '      </else-if>\n' +
      '      <else>\n' +
      '        <text term="no date" form="short"/>\n' +
      '        <text variable="year-suffix" prefix="-"/>\n' +
      '      </else>\n' +
      '    </choose>\n' +
      '  </macro>\n' +
      '  <macro name="date-in-text">\n' +
      '    <choose>\n' +
      '      <if variable="issued">\n' +
      '        <group delimiter=" ">\n' +
      '          <date variable="original-date" form="text" date-parts="year" prefix="[" suffix="]"/>\n' +
      '          <date variable="issued">\n' +
      '            <date-part name="year"/>\n' +
      '          </date>\n' +
      '        </group>\n' +
      '        <text variable="year-suffix"/>\n' +
      '      </if>\n' +
      '      <else-if variable="status">\n' +
      '        <text variable="status"/>\n' +
      '        <text variable="year-suffix" prefix="-"/>\n' +
      '      </else-if>\n' +
      '      <else>\n' +
      '        <text term="no date" form="short"/>\n' +
      '        <text variable="year-suffix" prefix="-"/>\n' +
      '      </else>\n' +
      '    </choose>\n' +
      '  </macro>\n' +
      '  <macro name="date-sort">\n' +
      '    <date variable="issued">\n' +
      '      <date-part name="year"/>\n' +
      '    </date>\n' +
      '  </macro>\n' +
      '  <macro name="day-month">\n' +
      '    <date variable="issued">\n' +
      '      <date-part name="month"/>\n' +
      '      <date-part name="day" prefix=" "/>\n' +
      '    </date>\n' +
      '  </macro>\n' +
      '  <macro name="collection-title">\n' +
      '    <choose>\n' +
      '      <if match="none" type="article-journal">\n' +
      '        <choose>\n' +
      '          <if match="none" is-numeric="collection-number">\n' +
      '            <group delimiter=", ">\n' +
      '              <text variable="collection-title" text-case="title"/>\n' +
      '              <text variable="collection-number"/>\n' +
      '            </group>\n' +
      '          </if>\n' +
      '          <else>\n' +
      '            <group delimiter=" ">\n' +
      '              <text variable="collection-title" text-case="title"/>\n' +
      '              <text variable="collection-number"/>\n' +
      '            </group>\n' +
      '          </else>\n' +
      '        </choose>\n' +
      '      </if>\n' +
      '    </choose>\n' +
      '  </macro>\n' +
      '  <macro name="collection-title-journal">\n' +
      '    <choose>\n' +
      '      <if type="article-journal">\n' +
      '        <group delimiter=" ">\n' +
      '          <text variable="collection-title"/>\n' +
      '          <text variable="collection-number"/>\n' +
      '        </group>\n' +
      '      </if>\n' +
      '    </choose>\n' +
      '  </macro>\n' +
      '  <macro name="event">\n' +
      '    <group delimiter=" ">\n' +
      '      <choose>\n' +
      '        <if variable="genre">\n' +
      '          <text term="presented at"/>\n' +
      '        </if>\n' +
      '        <else>\n' +
      '          <text term="presented at" text-case="capitalize-first"/>\n' +
      '        </else>\n' +
      '      </choose>\n' +
      '      <text variable="event"/>\n' +
      '    </group>\n' +
      '  </macro>\n' +
      '  <macro name="description">\n' +
      '    <choose>\n' +
      '      <if variable="interviewer" type="interview" match="any">\n' +
      '        <group delimiter=". ">\n' +
      '          <text macro="interviewer"/>\n' +
      '          <text variable="medium" text-case="capitalize-first"/>\n' +
      '        </group>\n' +
      '      </if>\n' +
      '      <else-if type="patent">\n' +
      '        <group delimiter=" " prefix=". ">\n' +
      '          <text variable="authority"/>\n' +
      '          <text variable="number"/>\n' +
      '        </group>\n' +
      '      </else-if>\n' +
      '      <else>\n' +
      '        <text variable="medium" text-case="capitalize-first" prefix=". "/>\n' +
      '      </else>\n' +
      '    </choose>\n' +
      '    <choose>\n' +
      '      <if variable="title" match="none"/>\n' +
      '      <else-if type="thesis personal_communication speech" match="any"/>\n' +
      '      <else>\n' +
      '        <group delimiter=" " prefix=". ">\n' +
      '          <text variable="genre" text-case="capitalize-first"/>\n' +
      '          <choose>\n' +
      '            <if type="report">\n' +
      '              <text variable="number"/>\n' +
      '            </if>\n' +
      '          </choose>\n' +
      '        </group>\n' +
      '      </else>\n' +
      '    </choose>\n' +
      '  </macro>\n' +
      '  <macro name="issue">\n' +
      '    <choose>\n' +
      '      <if type="legal_case">\n' +
      '        <text variable="authority" prefix=". "/>\n' +
      '      </if>\n' +
      '      <else-if type="speech">\n' +
      '        <group prefix=". " delimiter=", ">\n' +
      '          <group delimiter=" ">\n' +
      '            <text variable="genre" text-case="capitalize-first"/>\n' +
      '            <text macro="event"/>\n' +
      '          </group>\n' +
      '          <text variable="event-place"/>\n' +
      '          <text macro="day-month"/>\n' +
      '        </group>\n' +
      '      </else-if>\n' +
      '      <else-if type="article-newspaper article-magazine personal_communication" match="any">\n' +
      '        <date variable="issued" form="text" prefix=", "/>\n' +
      '      </else-if>\n' +
      '      <else-if type="patent">\n' +
      '        <group delimiter=", " prefix=", ">\n' +
      '          <group delimiter=" ">\n' +
      '            <!--Needs Localization-->\n' +
      '            <text value="filed"/>\n' +
      '            <date variable="submitted" form="text"/>\n' +
      '          </group>\n' +
      '          <group delimiter=" ">\n' +
      '            <choose>\n' +
      '              <if variable="issued submitted" match="all">\n' +
      '                <text term="and"/>\n' +
      '              </if>\n' +
      '            </choose>\n' +
      '            <!--Needs Localization-->\n' +
      '            <text value="issued"/>\n' +
      '            <date variable="issued" form="text"/>\n' +
      '          </group>\n' +
      '        </group>\n' +
      '      </else-if>\n' +
      '      <else-if type="article-journal" match="any"/>\n' +
      '      <else>\n' +
      '        <group prefix=". " delimiter=", ">\n' +
      '          <choose>\n' +
      '            <if type="thesis">\n' +
      '              <text variable="genre" text-case="capitalize-first"/>\n' +
      '            </if>\n' +
      '          </choose>\n' +
      '          <text macro="publisher"/>\n' +
      '        </group>\n' +
      '      </else>\n' +
      '    </choose>\n' +
      '  </macro>\n' +
      '  <citation et-al-min="4" et-al-use-first="1" disambiguate-add-year-suffix="true" disambiguate-add-names="true" disambiguate-add-givenname="true" givenname-disambiguation-rule="primary-name" collapse="year" after-collapse-delimiter="; ">\n' +
      '    <layout prefix="(" suffix=")" delimiter="; ">\n' +
      '      <group delimiter=", ">\n' +
      '        <choose>\n' +
      '          <if variable="issued" match="any">\n' +
      '            <group delimiter=" ">\n' +
      '              <text macro="contributors-short"/>\n' +
      '              <text macro="date-in-text"/>\n' +
      '            </group>\n' +
      '          </if>\n' +
      '          <!---comma before forthcoming and n.d.-->\n' +
      '          <else>\n' +
      '            <group delimiter=", ">\n' +
      '              <text macro="contributors-short"/>\n' +
      '              <text macro="date-in-text"/>\n' +
      '            </group>\n' +
      '          </else>\n' +
      '        </choose>\n' +
      '        <text macro="point-locators"/>\n' +
      '      </group>\n' +
      '    </layout>\n' +
      '  </citation>\n' +
      '  <bibliography hanging-indent="true" et-al-min="11" et-al-use-first="7" subsequent-author-substitute="&#8212;&#8212;&#8212;" entry-spacing="0">\n' +
      '    <sort>\n' +
      '      <key macro="contributors"/>\n' +
      '      <key macro="date-sort"/>\n' +
      '      <key variable="title"/>\n' +
      '    </sort>\n' +
      '    <layout suffix=".">\n' +
      '      <group delimiter=". ">\n' +
      '        <text macro="contributors"/>\n' +
      '        <text macro="date"/>\n' +
      '        <text macro="title"/>\n' +
      '      </group>\n' +
      '      <text macro="description"/>\n' +
      '      <text macro="secondary-contributors" prefix=". "/>\n' +
      '      <text macro="container-title" prefix=". "/>\n' +
      '      <text macro="container-contributors"/>\n' +
      '      <text macro="edition"/>\n' +
      '      <text macro="locators-chapter"/>\n' +
      '      <text macro="collection-title-journal" prefix=", " suffix=", "/>\n' +
      '      <text macro="locators"/>\n' +
      '      <text macro="collection-title" prefix=". "/>\n' +
      '      <text macro="issue"/>\n' +
      '      <text macro="locators-article"/>\n' +
      '      <text macro="access" prefix=". "/>\n' +
      '    </layout>\n' +
      '  </bibliography>\n' +
      '</style>';
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


}
