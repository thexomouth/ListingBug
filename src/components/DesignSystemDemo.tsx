import { useState } from "react";
import { LBButton } from "./design-system/LBButton";
import { LBInput } from "./design-system/LBInput";
import { LBSelect } from "./design-system/LBSelect";
import { LBToggle } from "./design-system/LBToggle";
import {
  LBCard,
  LBCardHeader,
  LBCardTitle,
  LBCardDescription,
  LBCardContent,
  LBCardFooter,
} from "./design-system/LBCard";
import {
  LBTable,
  LBTableHeader,
  LBTableBody,
  LBTableHead,
  LBTableRow,
  LBTableCell,
} from "./design-system/LBTable";
import { Mail, Search, Trash2, Edit, Eye } from "lucide-react";

export function DesignSystemDemo() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [toggle1, setToggle1] = useState(false);
  const [toggle2, setToggle2] = useState(true);
  const [toggle3, setToggle3] = useState(false);

  const validateEmail = (value: string) => {
    if (!value) {
      setEmailError("Email is required");
    } else if (!/\S+@\S+\.\S+/.test(value)) {
      setEmailError("Please enter a valid email");
    } else {
      setEmailError("");
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    validateEmail(value);
  };

  const propertyOptions = [
    { value: "single-family", label: "Single Family" },
    { value: "condo", label: "Condo" },
    { value: "townhouse", label: "Townhouse" },
    { value: "multi-family", label: "Multi-Family" },
  ];

  const tableData = [
    { id: 1, property: "123 Main St", type: "Single Family", price: "$750,000", status: "Active" },
    { id: 2, property: "456 Oak Ave", type: "Condo", price: "$525,000", status: "Active" },
    { id: 3, property: "789 Pine Rd", type: "Townhouse", price: "$625,000", status: "Pending" },
    { id: 4, property: "321 Elm St", type: "Multi-Family", price: "$1,200,000", status: "Active" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-12">
        <h1 className="mb-4">ListingBug Design System</h1>
        <p className="text-muted-foreground max-w-3xl">
          A comprehensive component library with consistent design tokens for color, typography,
          spacing, and elevation. All components are built for accessibility and reusability.
        </p>
      </div>

      {/* Design Tokens Overview */}
      <LBCard className="mb-8" elevation="md">
        <LBCardHeader>
          <LBCardTitle>Design Tokens</LBCardTitle>
          <LBCardDescription>
            Core design values used throughout the application
          </LBCardDescription>
        </LBCardHeader>
        <LBCardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Colors */}
            <div>
              <h4 className="mb-3">Colors</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-primary shadow-[var(--elevation-sm)]" />
                  <div>
                    <div className="text-sm">Primary</div>
                    <div className="text-xs text-muted-foreground">#2563eb</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-secondary border shadow-[var(--elevation-sm)]" />
                  <div>
                    <div className="text-sm">Secondary</div>
                    <div className="text-xs text-muted-foreground">#f1f5f9</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-destructive shadow-[var(--elevation-sm)]" />
                  <div>
                    <div className="text-sm">Destructive</div>
                    <div className="text-xs text-muted-foreground">#d4183d</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Spacing */}
            <div>
              <h4 className="mb-3">Spacing Scale</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-6 bg-primary rounded" />
                  <div className="text-sm">XS - 4px</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-6 bg-primary rounded" />
                  <div className="text-sm">SM - 8px</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-6 bg-primary rounded" />
                  <div className="text-sm">MD - 16px</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-primary rounded" />
                  <div className="text-sm">LG - 24px</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-6 bg-primary rounded" />
                  <div className="text-sm">XL - 32px</div>
                </div>
              </div>
            </div>

            {/* Elevation */}
            <div>
              <h4 className="mb-3">Elevation</h4>
              <div className="space-y-3">
                <div className="p-3 bg-card rounded-lg shadow-[var(--elevation-sm)]">
                  <div className="text-sm">Small</div>
                </div>
                <div className="p-3 bg-card rounded-lg shadow-[var(--elevation-md)]">
                  <div className="text-sm">Medium</div>
                </div>
                <div className="p-3 bg-card rounded-lg shadow-[var(--elevation-lg)]">
                  <div className="text-sm">Large</div>
                </div>
              </div>
            </div>

            {/* Typography */}
            <div>
              <h4 className="mb-3">Typography</h4>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Normal - 400</div>
                <div className="text-sm" style={{ fontWeight: "var(--font-weight-medium)" }}>
                  Medium - 500
                </div>
                <div className="text-sm" style={{ fontWeight: "var(--font-weight-semibold)" }}>
                  Semibold - 600
                </div>
                <div className="text-sm" style={{ fontWeight: "var(--font-weight-bold)" }}>
                  Bold - 700
                </div>
              </div>
            </div>
          </div>
        </LBCardContent>
      </LBCard>

      {/* Buttons */}
      <LBCard className="mb-8" elevation="sm">
        <LBCardHeader>
          <LBCardTitle>Buttons</LBCardTitle>
          <LBCardDescription>
            Primary, secondary, ghost, destructive, and outline variants with three sizes
          </LBCardDescription>
        </LBCardHeader>
        <LBCardContent>
          <div className="space-y-6">
            <div>
              <h4 className="mb-3">Variants</h4>
              <div className="flex flex-wrap gap-3">
                <LBButton variant="primary">Primary Button</LBButton>
                <LBButton variant="secondary">Secondary Button</LBButton>
                <LBButton variant="ghost">Ghost Button</LBButton>
                <LBButton variant="destructive">Destructive Button</LBButton>
                <LBButton variant="outline">Outline Button</LBButton>
              </div>
            </div>

            <div>
              <h4 className="mb-3">Sizes</h4>
              <div className="flex flex-wrap items-center gap-3">
                <LBButton size="sm">Small</LBButton>
                <LBButton size="md">Medium</LBButton>
                <LBButton size="lg">Large</LBButton>
              </div>
            </div>

            <div>
              <h4 className="mb-3">With Icons</h4>
              <div className="flex flex-wrap gap-3">
                <LBButton>
                  <Search className="w-4 h-4" />
                  Search
                </LBButton>
                <LBButton variant="secondary">
                  <Edit className="w-4 h-4" />
                  Edit
                </LBButton>
                <LBButton variant="destructive">
                  <Trash2 className="w-4 h-4" />
                  Delete
                </LBButton>
              </div>
            </div>

            <div>
              <h4 className="mb-3">States</h4>
              <div className="flex flex-wrap gap-3">
                <LBButton disabled>Disabled Button</LBButton>
                <LBButton variant="secondary" disabled>
                  Disabled Secondary
                </LBButton>
              </div>
            </div>
          </div>
        </LBCardContent>
      </LBCard>

      {/* Input Fields */}
      <LBCard className="mb-8" elevation="sm">
        <LBCardHeader>
          <LBCardTitle>Input Fields</LBCardTitle>
          <LBCardDescription>
            Form inputs with validation states, icons, and helper text
          </LBCardDescription>
        </LBCardHeader>
        <LBCardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <LBInput
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={handleEmailChange}
              error={emailError}
              required
            />

            <LBInput
              label="Password"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              helperText="Must be at least 8 characters"
              success={password.length >= 8 ? "Password strength: Good" : undefined}
            />

            <LBInput
              label="Search Properties"
              type="text"
              placeholder="Search by address, city, or ZIP"
              icon={<Search className="w-4 h-4" />}
            />

            <LBInput
              label="Contact Email"
              type="email"
              placeholder="contact@example.com"
              icon={<Mail className="w-4 h-4" />}
              helperText="We'll never share your email"
            />

            <LBInput label="Disabled Input" type="text" disabled value="Cannot edit" />

            <LBInput
              label="Required Field"
              type="text"
              placeholder="This field is required"
              required
            />
          </div>
        </LBCardContent>
      </LBCard>

      {/* Select Dropdowns */}
      <LBCard className="mb-8" elevation="sm">
        <LBCardHeader>
          <LBCardTitle>Select Dropdowns</LBCardTitle>
          <LBCardDescription>Styled select inputs with validation</LBCardDescription>
        </LBCardHeader>
        <LBCardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <LBSelect
              label="Property Type"
              placeholder="Select a property type"
              options={propertyOptions}
              value={propertyType}
              onChange={setPropertyType}
              helperText="Choose the type of property"
            />

            <LBSelect
              label="Status"
              options={[
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
                { value: "pending", label: "Pending" },
              ]}
              error="Please select a status"
            />

            <LBSelect
              label="Bedrooms"
              options={[
                { value: "1", label: "1 Bedroom" },
                { value: "2", label: "2 Bedrooms" },
                { value: "3", label: "3 Bedrooms" },
                { value: "4", label: "4+ Bedrooms" },
              ]}
            />

            <LBSelect
              label="Disabled Select"
              options={[{ value: "option", label: "Option" }]}
              disabled
            />
          </div>
        </LBCardContent>
      </LBCard>

      {/* Toggles */}
      <LBCard className="mb-8" elevation="sm">
        <LBCardHeader>
          <LBCardTitle>Toggle Switches</LBCardTitle>
          <LBCardDescription>Toggle switches in multiple sizes with labels</LBCardDescription>
        </LBCardHeader>
        <LBCardContent>
          <div className="space-y-6">
            <div>
              <h4 className="mb-3">With Labels</h4>
              <div className="space-y-4">
                <LBToggle
                  checked={toggle1}
                  onCheckedChange={setToggle1}
                  label="Enable Notifications"
                  description="Receive email updates about new listings"
                />
                <LBToggle
                  checked={toggle2}
                  onCheckedChange={setToggle2}
                  label="Automated Reporting"
                  description="Run reports automatically on a schedule"
                />
                <LBToggle
                  checked={toggle3}
                  onCheckedChange={setToggle3}
                  label="Dark Mode"
                  description="Switch to dark color scheme"
                />
              </div>
            </div>

            <div>
              <h4 className="mb-3">Sizes</h4>
              <div className="space-y-4">
                <LBToggle checked={true} size="sm" label="Small Toggle" />
                <LBToggle checked={true} size="md" label="Medium Toggle" />
                <LBToggle checked={true} size="lg" label="Large Toggle" />
              </div>
            </div>

            <div>
              <h4 className="mb-3">States</h4>
              <div className="space-y-4">
                <LBToggle checked={false} label="Disabled Off" disabled />
                <LBToggle checked={true} label="Disabled On" disabled />
              </div>
            </div>
          </div>
        </LBCardContent>
      </LBCard>

      {/* Cards */}
      <LBCard className="mb-8" elevation="sm">
        <LBCardHeader>
          <LBCardTitle>Cards</LBCardTitle>
          <LBCardDescription>
            Container components with various elevations and padding options
          </LBCardDescription>
        </LBCardHeader>
        <LBCardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <LBCard elevation="sm" hover>
              <LBCardHeader>
                <LBCardTitle>Small Elevation</LBCardTitle>
                <LBCardDescription>Subtle shadow</LBCardDescription>
              </LBCardHeader>
              <LBCardContent>
                <p className="text-sm text-muted-foreground">
                  This card has a small elevation and hover effect.
                </p>
              </LBCardContent>
            </LBCard>

            <LBCard elevation="md" hover>
              <LBCardHeader>
                <LBCardTitle>Medium Elevation</LBCardTitle>
                <LBCardDescription>Standard shadow</LBCardDescription>
              </LBCardHeader>
              <LBCardContent>
                <p className="text-sm text-muted-foreground">
                  This card has a medium elevation and hover effect.
                </p>
              </LBCardContent>
            </LBCard>

            <LBCard elevation="lg" hover>
              <LBCardHeader>
                <LBCardTitle>Large Elevation</LBCardTitle>
                <LBCardDescription>Prominent shadow</LBCardDescription>
              </LBCardHeader>
              <LBCardContent>
                <p className="text-sm text-muted-foreground">
                  This card has a large elevation and hover effect.
                </p>
              </LBCardContent>
            </LBCard>
          </div>

          <div className="mt-6">
            <LBCard elevation="md">
              <LBCardHeader>
                <LBCardTitle>Card with Footer</LBCardTitle>
                <LBCardDescription>Example of a card with all sections</LBCardDescription>
              </LBCardHeader>
              <LBCardContent>
                <p className="text-sm text-muted-foreground">
                  This card demonstrates the header, content, and footer sections working together.
                </p>
              </LBCardContent>
              <LBCardFooter>
                <LBButton variant="primary" size="sm">
                  Action
                </LBButton>
                <LBButton variant="ghost" size="sm">
                  Cancel
                </LBButton>
              </LBCardFooter>
            </LBCard>
          </div>
        </LBCardContent>
      </LBCard>

      {/* Tables */}
      <LBCard className="mb-8" elevation="sm">
        <LBCardHeader>
          <LBCardTitle>Tables</LBCardTitle>
          <LBCardDescription>Data tables with hover states and actions</LBCardDescription>
        </LBCardHeader>
        <LBCardContent>
          <LBTable>
            <LBTableHeader>
              <LBTableRow>
                <LBTableHead>Property</LBTableHead>
                <LBTableHead>Type</LBTableHead>
                <LBTableHead>Price</LBTableHead>
                <LBTableHead>Status</LBTableHead>
                <LBTableHead className="text-right">Actions</LBTableHead>
              </LBTableRow>
            </LBTableHeader>
            <LBTableBody>
              {tableData.map((row) => (
                <LBTableRow key={row.id}>
                  <LBTableCell>{row.property}</LBTableCell>
                  <LBTableCell>{row.type}</LBTableCell>
                  <LBTableCell>{row.price}</LBTableCell>
                  <LBTableCell>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                        row.status === "Active"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {row.status}
                    </span>
                  </LBTableCell>
                  <LBTableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <LBButton variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </LBButton>
                      <LBButton variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </LBButton>
                      <LBButton variant="ghost" size="sm">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </LBButton>
                    </div>
                  </LBTableCell>
                </LBTableRow>
              ))}
            </LBTableBody>
          </LBTable>
        </LBCardContent>
      </LBCard>
    </div>
  );
}
