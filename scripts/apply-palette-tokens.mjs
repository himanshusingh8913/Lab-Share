import fs from 'fs';
import path from 'path';

const filesToUpdate = [
  'src/components/DashboardView.tsx',
  'src/components/ResourceCatalog.tsx',
  'src/components/BookingsHub.tsx',
  'src/components/IncidentCenter.tsx',
  'src/components/AuditLogViewer.tsx',
  'src/components/BookingModal.tsx',
  'src/components/AiAssistantModal.tsx',
  'src/components/JudgeTestingPanel.tsx',
];

const replacements = [
  // Opacity variations first
  { regex: /border-\[#0866E8\]\/20/g, replacement: 'border-[var(--border-default)]' },
  { regex: /border-\[#0866E8\]\/30/g, replacement: 'border-[var(--border-default)]' },
  { regex: /border-\[#0866E8\]\/40/g, replacement: 'border-[var(--border-default)]' },
  { regex: /bg-\[#0866E8\]\/10/g, replacement: 'bg-[var(--brand-primary-soft)]' },
  { regex: /bg-\[#0866E8\]\/20/g, replacement: 'bg-[var(--brand-primary-soft)]' },
  { regex: /bg-\[#0866E8\]\/30/g, replacement: 'bg-[var(--brand-primary-soft)]' },
  { regex: /text-\[#0866E8\]\/80/g, replacement: 'text-[var(--text-secondary)]' },

  // Direct hex codes
  { regex: /#0866E8/g, replacement: 'var(--brand-primary)' },
  { regex: /#0757C8/g, replacement: 'var(--brand-primary-hover)' },
  { regex: /#E9F0FF/g, replacement: 'var(--brand-primary-soft)' },
  { regex: /#F3F4FF/g, replacement: 'var(--background-main)' },
  { regex: /#ECEEFA/g, replacement: 'var(--background-secondary)' },
  { regex: /#283347/g, replacement: 'var(--text-primary)' },
  { regex: /#687386/g, replacement: 'var(--text-secondary)' },
  { regex: /#929BAD/g, replacement: 'var(--text-muted)' },
  { regex: /#E1E5EF/g, replacement: 'var(--border-default)' },
  { regex: /#CED4E2/g, replacement: 'var(--border-strong)' },
  { regex: /#079B58/g, replacement: 'var(--status-success)' },
  { regex: /#E5F7EB/g, replacement: 'var(--status-success-soft)' },
  { regex: /#FFF16B/g, replacement: 'var(--accent-yellow)' },
  { regex: /#FF827A/g, replacement: 'var(--accent-coral)' },

  // Surfaces: Avoid stark white on paper surfaces
  { regex: /\bbg-white\b/g, replacement: 'bg-[var(--surface-primary)]' },
];

for (const relPath of filesToUpdate) {
  const fullPath = path.resolve(process.cwd(), relPath);
  if (!fs.existsSync(fullPath)) continue;
  let content = fs.readFileSync(fullPath, 'utf8');

  for (const { regex, replacement } of replacements) {
    content = content.replace(regex, replacement);
  }

  // Ensure image fallbacks in ResourceCatalog
  if (relPath.includes('ResourceCatalog.tsx')) {
    content = content.replace(
      /<img\s+src=\{flagshipResource\.imageUrl\}\s+alt=\{flagshipResource\.name\}\s+className="([^"]+)"\s*\/>/,
      `<img src={flagshipResource.imageUrl} alt={flagshipResource.name} className="$1" onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80'; }} />`
    );
    content = content.replace(
      /<img\s+src=\{resource\.imageUrl\}\s+alt=\{resource\.name\}\s+className="([^"]+)"\s*\/>/,
      `<img src={resource.imageUrl} alt={resource.name} className="$1" onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80'; }} />`
    );
  }

  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`Updated tokens in ${relPath}`);
}
