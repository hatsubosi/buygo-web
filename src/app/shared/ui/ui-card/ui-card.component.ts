import {
    Component,
    ChangeDetectionStrategy,
    input,
} from '@angular/core';

@Component({
    selector: 'app-ui-card',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [],
    templateUrl: './ui-card.component.html',
})
export class UiCardComponent {
    title = input<string>('');
    subtitle = input<string>('');
    badgeText = input<string>('');
    badgeClass = input<string>('');
}
