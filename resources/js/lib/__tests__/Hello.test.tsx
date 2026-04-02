import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

function Hello() {
    return <span>Hello</span>;
}

describe('Hello', () => {
    it('renders text', () => {
        const { getByText } = render(<Hello />);
        expect(getByText('Hello')).toBeInTheDocument();
    });
});
