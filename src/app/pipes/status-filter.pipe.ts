import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'statusFilter',
  standalone: true, // ⚠ IMPORTANT (since you're using standalone components)
})
export class StatusFilterPipe implements PipeTransform {
  transform(data: any[], status: string): any[] {
    if (!data || !status) return data;
    return data.filter((item) => item.status === status);
  }
}
