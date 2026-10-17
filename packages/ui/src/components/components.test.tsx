import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  Avatar,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  EmptyState,
  ErrorState,
  ProgressBar,
  ProgressRing,
} from '../index';

describe('Button', () => {
  it('defaults to type="button" so it never submits a form by accident', () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute('type', 'button');
  });

  it('renders as a link when asChild is used', () => {
    render(
      <Button asChild>
        <a href="/dashboard">Open</a>
      </Button>,
    );
    expect(screen.getByRole('link', { name: 'Open' })).toHaveAttribute('href', '/dashboard');
  });
});

describe('progress components', () => {
  it('exposes accessible progressbar semantics and clamps values', () => {
    render(
      <>
        <ProgressBar value={140} label="Course progress" />
        <ProgressRing value={42.4} label="Daily goal">
          <span>42%</span>
        </ProgressRing>
      </>,
    );
    expect(screen.getByRole('progressbar', { name: 'Course progress' })).toHaveAttribute(
      'aria-valuenow',
      '100',
    );
    expect(screen.getByRole('progressbar', { name: 'Daily goal' })).toHaveAttribute(
      'aria-valuenow',
      '42',
    );
  });
});

describe('states', () => {
  it('announces errors and wires the retry action', () => {
    const onRetry = vi.fn();
    render(<ErrorState title="Failed" description="Try again later" retryLabel="Retry" onRetry={onRetry} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Failed');
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('renders an empty state with an optional action', () => {
    render(<EmptyState title="Nothing here" description="Add something" action={<button>Add</button>} />);
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
  });

  it('derives avatar initials from the name', () => {
    const { container } = render(<Avatar name="Vaibhav More" />);
    expect(container).toHaveTextContent('VM');
  });
});

describe('overlays and controls', () => {
  it('opens an accessible dialog and closes it with the keyboard', async () => {
    const user = userEvent.setup();
    render(
      <Dialog>
        <DialogTrigger>Open dialog</DialogTrigger>
        <DialogContent closeLabel="Close dialog">
          <DialogTitle>Log study time</DialogTitle>
          <DialogDescription>Record what you studied.</DialogDescription>
        </DialogContent>
      </Dialog>,
    );
    await user.click(screen.getByRole('button', { name: 'Open dialog' }));
    expect(await screen.findByRole('dialog', { name: 'Log study time' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('toggles a checkbox with the keyboard', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Checkbox aria-label="Done" onCheckedChange={onChange} />);
    await user.tab();
    await user.keyboard(' ');
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
