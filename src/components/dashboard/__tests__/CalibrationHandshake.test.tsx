/**
 * Unit tests for CalibrationHandshake component
 * 
 * Tests selection state, navigation, and accessibility.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CalibrationHandshake } from '../CalibrationHandshake';

describe('CalibrationHandshake', () => {
  const mockOnComplete = vi.fn();

  beforeEach(() => {
    mockOnComplete.mockClear();
  });

  it('renders Step 1 with facility count input', () => {
    render(<CalibrationHandshake onComplete={mockOnComplete} />);
    
    expect(screen.getByLabelText(/How many facilities/i)).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('allows navigation from Step 1 to Step 2 when facility count is valid', async () => {
    const user = userEvent.setup();
    render(<CalibrationHandshake onComplete={mockOnComplete} />);
    
    const input = screen.getByLabelText(/How many facilities/i);
    await user.clear(input);
    await user.type(input, '25');
    
    const continueButton = screen.getByRole('button', { name: /Continue/i });
    await user.click(continueButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Where does leadership attention/i)).toBeInTheDocument();
    });
  });

  it('prevents navigation from Step 1 when facility count is invalid', async () => {
    const user = userEvent.setup();
    render(<CalibrationHandshake onComplete={mockOnComplete} />);
    
    const input = screen.getByLabelText(/How many facilities/i);
    await user.clear(input);
    await user.type(input, '0');
    
    const continueButton = screen.getByRole('button', { name: /Continue/i });
    expect(continueButton).toBeDisabled();
  });

  it('renders Step 2 with focus area cards', async () => {
    const user = userEvent.setup();
    render(<CalibrationHandshake onComplete={mockOnComplete} />);
    
    // Navigate to Step 2
    const input = screen.getByLabelText(/How many facilities/i);
    await user.clear(input);
    await user.type(input, '15');
    await user.click(screen.getByRole('button', { name: /Continue/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/Where does leadership attention/i)).toBeInTheDocument();
    });
    
    // Check focus options are rendered
    expect(screen.getByText('Staffing')).toBeInTheDocument();
    expect(screen.getByText('Billing')).toBeInTheDocument();
    expect(screen.getByText('Safety')).toBeInTheDocument();
    expect(screen.getByText('Documentation')).toBeInTheDocument();
  });

  it('allows selection of focus area and shows confirmation', async () => {
    const user = userEvent.setup();
    render(<CalibrationHandshake onComplete={mockOnComplete} />);
    
    // Navigate to Step 2
    const input = screen.getByLabelText(/How many facilities/i);
    await user.clear(input);
    await user.type(input, '15');
    await user.click(screen.getByRole('button', { name: /Continue/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Staffing')).toBeInTheDocument();
    });
    
    // Select a focus area
    const staffingCard = screen.getByRole('radio', { name: /Select Staffing/i });
    await user.click(staffingCard);
    
    // Check confirmation message appears
    await waitFor(() => {
      expect(screen.getByText(/This frames this week's attention priorities/i)).toBeInTheDocument();
    });
    
    // Check card is selected (has checkmark)
    expect(staffingCard).toHaveAttribute('aria-checked', 'true');
  });

  it('prevents navigation from Step 2 without focus selection', async () => {
    const user = userEvent.setup();
    render(<CalibrationHandshake onComplete={mockOnComplete} />);
    
    // Navigate to Step 2
    const input = screen.getByLabelText(/How many facilities/i);
    await user.clear(input);
    await user.type(input, '15');
    await user.click(screen.getByRole('button', { name: /Continue/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Staffing')).toBeInTheDocument();
    });
    
    // Try to continue without selection
    const continueButton = screen.getByRole('button', { name: /Continue/i });
    expect(continueButton).toBeDisabled();
  });

  it('renders Step 3 with objective options', async () => {
    const user = userEvent.setup();
    render(<CalibrationHandshake onComplete={mockOnComplete} />);
    
    // Navigate through steps
    const input = screen.getByLabelText(/How many facilities/i);
    await user.clear(input);
    await user.type(input, '15');
    await user.click(screen.getByRole('button', { name: /Continue/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Staffing')).toBeInTheDocument();
    });
    
    await user.click(screen.getByRole('radio', { name: /Select Staffing/i }));
    await user.click(screen.getByRole('button', { name: /Continue/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/What level of detail/i)).toBeInTheDocument();
    });
    
    // Check objective options are rendered
    expect(screen.getByText('Broad weekly scan')).toBeInTheDocument();
    expect(screen.getByText('Narrow deep dive')).toBeInTheDocument();
  });

  it('allows selection of objective option', async () => {
    const user = userEvent.setup();
    render(<CalibrationHandshake onComplete={mockOnComplete} />);
    
    // Navigate through steps
    const input = screen.getByLabelText(/How many facilities/i);
    await user.clear(input);
    await user.type(input, '15');
    await user.click(screen.getByRole('button', { name: /Continue/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Staffing')).toBeInTheDocument();
    });
    
    await user.click(screen.getByRole('radio', { name: /Select Staffing/i }));
    await user.click(screen.getByRole('button', { name: /Continue/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Broad weekly scan')).toBeInTheDocument();
    });
    
    // Select an objective
    const broadOption = screen.getByRole('radio', { name: /Select Broad weekly scan/i });
    await user.click(broadOption);
    
    expect(broadOption).toHaveAttribute('aria-checked', 'true');
  });

  it('calls onComplete with correct answers when all steps completed', async () => {
    const user = userEvent.setup();
    render(<CalibrationHandshake onComplete={mockOnComplete} />);
    
    // Step 1
    const input = screen.getByLabelText(/How many facilities/i);
    await user.clear(input);
    await user.type(input, '25');
    await user.click(screen.getByRole('button', { name: /Continue/i }));
    
    // Step 2
    await waitFor(() => {
      expect(screen.getByText('Staffing')).toBeInTheDocument();
    });
    await user.click(screen.getByRole('radio', { name: /Select Staffing/i }));
    await user.click(screen.getByRole('button', { name: /Continue/i }));
    
    // Step 3
    await waitFor(() => {
      expect(screen.getByText('Broad weekly scan')).toBeInTheDocument();
    });
    await user.click(screen.getByRole('radio', { name: /Select Broad weekly scan/i }));
    await user.click(screen.getByRole('button', { name: /Begin Briefing/i }));
    
    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalledWith({
        facilityCount: 25,
        focusArea: 'staffing',
        objective: 'broad',
      });
    });
  });

  it('supports keyboard navigation in Step 2', async () => {
    const user = userEvent.setup();
    render(<CalibrationHandshake onComplete={mockOnComplete} />);
    
    // Navigate to Step 2
    const input = screen.getByLabelText(/How many facilities/i);
    await user.clear(input);
    await user.type(input, '15');
    await user.click(screen.getByRole('button', { name: /Continue/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Staffing')).toBeInTheDocument();
    });
    
    // Use arrow keys to navigate
    const firstCard = screen.getByRole('radio', { name: /Select Staffing/i });
    firstCard.focus();
    
    await user.keyboard('{ArrowDown}');
    
    // Second card should be focused
    const secondCard = screen.getByRole('radio', { name: /Select Billing/i });
    expect(secondCard).toHaveFocus();
  });

  it('supports Enter key to select and proceed', async () => {
    const user = userEvent.setup();
    render(<CalibrationHandshake onComplete={mockOnComplete} />);
    
    // Navigate to Step 2
    const input = screen.getByLabelText(/How many facilities/i);
    await user.clear(input);
    await user.type(input, '15');
    await user.click(screen.getByRole('button', { name: /Continue/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Staffing')).toBeInTheDocument();
    });
    
    // Select with Enter
    const staffingCard = screen.getByRole('radio', { name: /Select Staffing/i });
    staffingCard.focus();
    await user.keyboard('{Enter}');
    
    // Should be selected
    expect(staffingCard).toHaveAttribute('aria-checked', 'true');
  });

  it('allows going back to previous steps', async () => {
    const user = userEvent.setup();
    render(<CalibrationHandshake onComplete={mockOnComplete} />);
    
    // Navigate to Step 2
    const input = screen.getByLabelText(/How many facilities/i);
    await user.clear(input);
    await user.type(input, '15');
    await user.click(screen.getByRole('button', { name: /Continue/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Staffing')).toBeInTheDocument();
    });
    
    // Go back
    const backButton = screen.getByRole('button', { name: /Back/i });
    await user.click(backButton);
    
    // Should be back at Step 1
    await waitFor(() => {
      expect(screen.getByLabelText(/How many facilities/i)).toBeInTheDocument();
    });
  });
});




