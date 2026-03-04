import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'categoryFilter',
  standalone: true,
})
export class CategoryFilterPipe implements PipeTransform {
  transform(categories: string[], search: string): string[] {
    if (!search) return categories;
    return categories.filter((c) =>
      c.toLowerCase().includes(search.toLowerCase()),
    );
  }
}
