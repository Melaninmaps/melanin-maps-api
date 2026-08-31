// UpgradeModal — disabled for v1.0 free release. Re-enable in v1.1 with IAP.

type Props = {
  visible: boolean;
  onClose: () => void;
  feature?: string;
  reason?: string;
};

// Returns null — no upgrade modal in v1.0 free build.
export function UpgradeModal(_props: Props) {
  return null;
}
