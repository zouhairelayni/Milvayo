// /src/components/shell/ScreenErrorBoundary.js
import { Component } from 'react';
import { View } from 'react-native';
import { Button, T } from '../../ui/ui';
import { diagnosticMonitor } from '../../diagnostics/monitor';

// Catch JavaScript screen-render failures locally. In Expo Go an uncaught render
// exception can reset the entire shell to its default Overview tab, masking the
// actual screen that failed. Native process exits still require device logs.
export default class ScreenErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) {
    diagnosticMonitor.captureError(error, 'React render boundary', this.props.screenId, info?.componentStack || '');
    console.error(`[Niyarvo screen: ${this.props.screenId}]`, error, info?.componentStack || '');
  }
  render() {
    if (!this.state.error) return this.props.children;
    return <View style={{ flex: 1, padding: 22, gap: 14 }}>
      <T size={19} weight="600">{this.props.screenId} couldn't open</T>
      <T size={13} muted>Retry this screen. If the problem continues, open Settings diagnostics to see the error details.</T>
      <T size={12} muted>Other screens remain available while this one is unavailable.</T>
      <Button label="Retry screen" small variant="secondary" onPress={() => { diagnosticMonitor.recordAction('retry screen'); this.setState({ error: null }); }} />
      {this.props.go ? <Button label="Open Settings diagnostics" small variant="ghost" onPress={() => this.props.go('settings')} /> : null}
    </View>;
  }
}
