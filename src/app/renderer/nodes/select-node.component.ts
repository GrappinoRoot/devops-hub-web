import {
  ChangeDetectionStrategy,
  Component,
  Input,
  inject,
} from '@angular/core';
import type { UiNode } from '@devops-hub/contracts';
import { UiEventBusService } from '../../core/ui/ui-event-bus.service';

interface SelectOption {
  value: string;
  label: string;
}

/**
 * Generic dropdown node. Emits `select.change` with `{ name, value }` so
 * downstream listeners can filter or react to the selected option.
 */
@Component({
  selector: 'ui-select-node',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label class="wrap">
      @if (label()) {
        <span class="lbl">{{ label() }}</span>
      }
      <select class="sel" (change)="onChange($any($event.target).value)">
        <option value="">{{ placeholder() }}</option>
        @for (o of options(); track o.value) {
          <option [value]="o.value">{{ o.label }}</option>
        }
      </select>
    </label>
  `,
  styles: [
    `.wrap { display: inline-flex; align-items: center; gap: 6px; }`,
    `.lbl { font-size: 13px; color: #475569; }`,
    `.sel { padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 6px;
            background: #fff; font: inherit; min-width: 140px; }`,
  ],
})
export class SelectNodeComponent {
  @Input({ required: true }) node!: UiNode;

  private readonly bus = inject(UiEventBusService);

  label(): string | null {
    return (this.node.props?.['label'] as string) ?? null;
  }
  placeholder(): string {
    return (this.node.props?.['placeholder'] as string) ?? 'Any';
  }
  options(): SelectOption[] {
    return (this.node.props?.['options'] as SelectOption[]) ?? [];
  }
  private name(): string {
    return (this.node.props?.['name'] as string) ?? this.node.id;
  }

  onChange(value: string): void {
    this.bus.emit('select.change', this.node.id, {
      name: this.name(),
      value: value || null,
    });
  }
}
