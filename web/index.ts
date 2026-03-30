// even-toolkit/web — Shared web UI components for Even Realities apps

// Utils
export { cn } from './utils/cn';

// Icons
export { Icon, registerIcon, registerIcons, getIconNames } from './icons/index';
export type { IconProps, IconComponent } from './icons/index';
export { allIcons } from './icons/svg-icons';
export { svgCatalog, svgIconNames, svgIconCount } from './icons/svg-catalog';

// Primitives
export { Button, buttonVariants } from './components/button';
export type { ButtonProps } from './components/button';

export { Card, cardVariants } from './components/card';
export type { CardProps } from './components/card';

export { Badge, badgeVariants } from './components/badge';
export type { BadgeProps } from './components/badge';

export { Input } from './components/input';
export type { InputProps } from './components/input';

export { Textarea } from './components/textarea';
export type { TextareaProps } from './components/textarea';

export { Select } from './components/select';
export type { SelectProps, SelectOption } from './components/select';

export { Progress } from './components/progress';
export type { ProgressProps } from './components/progress';

export { StatusDot } from './components/status-dot';
export type { StatusDotProps } from './components/status-dot';

export { Pill } from './components/pill';
export type { PillProps } from './components/pill';

export { Toggle } from './components/toggle';
export type { ToggleProps } from './components/toggle';

export { MultiSelect } from './components/multi-select';
export type { MultiSelectProps, MultiSelectOption } from './components/multi-select';

export { SegmentedControl } from './components/segmented-control';
export type { SegmentedControlProps, SegmentedControlOption } from './components/segmented-control';

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './components/table';

export { Kbd } from './components/kbd';
export type { KbdProps } from './components/kbd';

export { Divider, dividerVariants } from './components/divider';
export type { DividerProps } from './components/divider';

// Layout & Navigation
export { NavBar } from './components/nav-bar';
export type { NavBarProps, NavItem } from './components/nav-bar';

export { Page } from './components/page';
export type { PageProps } from './components/page';

export { ScreenHeader } from './components/screen-header';
export type { ScreenHeaderProps } from './components/screen-header';

export { SectionHeader } from './components/section-header';
export type { SectionHeaderProps } from './components/section-header';

export { SettingsGroup } from './components/settings-group';
export type { SettingsGroupProps } from './components/settings-group';

export { CategoryFilter } from './components/category-filter';
export type { CategoryFilterProps } from './components/category-filter';

export { ListItem } from './components/list-item';
export type { ListItemProps } from './components/list-item';

export { SearchBar } from './components/search-bar';
export type { SearchBarProps } from './components/search-bar';

// Feedback & Overlay
export { TimerRing } from './components/timer-ring';
export type { TimerRingProps } from './components/timer-ring';

export { Dialog } from './components/dialog';
export type { DialogProps, DialogAction } from './components/dialog';

export { Toast, toastVariants } from './components/toast';
export type { ToastProps } from './components/toast';

export { EmptyState } from './components/empty-state';
export type { EmptyStateProps } from './components/empty-state';

export { Loading } from './components/loading';
export type { LoadingProps } from './components/loading';

// New components from Figma Design Guidelines
export { NavHeader } from './components/nav-header';
export type { NavHeaderProps } from './components/nav-header';

export { BottomSheet } from './components/bottom-sheet';
export type { BottomSheetProps } from './components/bottom-sheet';

export { CTAGroup } from './components/cta-group';
export type { CTAGroupProps, CTAAction } from './components/cta-group';

export { Tag, TagCarousel, TagCard } from './components/tag';
export type { TagProps, TagCarouselProps, TagCardProps } from './components/tag';

export { SliderIndicator, PageIndicator } from './components/indicator';
export type { SliderIndicatorProps, PageIndicatorProps } from './components/indicator';

// Phase 1A: Foundational components
export { Checkbox } from './components/checkbox';
export type { CheckboxProps } from './components/checkbox';

export { RadioGroup } from './components/radio-group';
export type { RadioGroupProps, RadioOption } from './components/radio-group';

export { Slider } from './components/slider';
export type { SliderProps } from './components/slider';

export { Skeleton, skeletonVariants } from './components/skeleton';
export type { SkeletonProps } from './components/skeleton';

export { InputGroup } from './components/input-group';
export type { InputGroupProps } from './components/input-group';

export { StepIndicator } from './components/step-indicator';
export type { StepIndicatorProps } from './components/step-indicator';

export { ConfirmDialog } from './components/confirm-dialog';
export type { ConfirmDialogProps } from './components/confirm-dialog';

// Phase 1B: Premium components
export { ChatContainer, ChatBubble, ChatInput, ChatThinking, ChatCodeBlock, ChatDiff, ChatToolCall, ChatCommand, ChatError } from './components/chat';
export type { ChatMessage, ChatContainerProps, ChatBubbleProps, ChatInputProps, ToolCall, CodeBlock } from './components/chat';

export { Calendar } from './components/calendar';
export type { CalendarProps, CalendarEvent, CalendarView } from './components/calendar';

export { Sparkline, LineChart, BarChart, PieChart, StatCard } from './components/chart';
export type { SparklineProps, LineChartProps, LineChartPoint, BarChartProps, BarChartItem, PieChartProps, PieChartItem, StatCardProps } from './components/chart';

// Phase 1C: Data visualization
export { Timeline } from './components/timeline';
export type { TimelineProps, TimelineEvent } from './components/timeline';

export { StatGrid } from './components/stat-grid';
export type { StatGridProps, StatItem } from './components/stat-grid';

export { StatusProgress } from './components/status-progress';
export type { StatusProgressProps, StatusProgressStep } from './components/status-progress';

// Phase 1D: Input & Media
export { FileUpload } from './components/file-upload';
export type { FileUploadProps } from './components/file-upload';

export { VoiceInput, WaveformVisualizer } from './components/voice-input';
export type { VoiceInputProps, WaveformVisualizerProps } from './components/voice-input';

export { ImageGrid, ImageViewer } from './components/image-viewer';
export type { ImageGridProps, ImageViewerProps, ImageItem } from './components/image-viewer';

export { AudioPlayer } from './components/audio-player';
export type { AudioPlayerProps } from './components/audio-player';

// App Shell
export { AppShell } from './components/app-shell';
export type { AppShellProps } from './components/app-shell';

export { SideDrawer, DrawerTrigger, DrawerHeaderContext, useDrawerHeader } from './components/side-drawer';
export type { SideDrawerProps, SideDrawerItem, DrawerHeaderConfig, DrawerHeaderContextValue } from './components/side-drawer';

export { DrawerShell } from './components/drawer-shell';
export type { DrawerShellProps } from './components/drawer-shell';

// Scroll Picker
export { ScrollPicker, DatePicker, TimePicker, SelectionPicker } from './components/scroll-picker';
export type { ScrollPickerProps, ScrollColumn, DatePickerProps, TimePickerProps, SelectionPickerProps } from './components/scroll-picker';
