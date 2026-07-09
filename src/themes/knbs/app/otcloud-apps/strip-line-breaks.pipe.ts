import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'stripLineBreaks',standalone: true })
export class StripLineBreaksPipe implements PipeTransform {
  transform(value: string): string {
    return value ? value.replace(/(\r\n|\n|\r)/g, ' ') : value;
  }
}