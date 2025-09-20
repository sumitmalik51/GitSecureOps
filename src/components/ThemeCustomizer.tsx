import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Palette, 
  Monitor, 
  Sun, 
  Moon, 
  Upload, 
  Download, 
  RotateCcw,
  Eye,
  Check,
  X
} from 'lucide-react'
import { useTheme, OrganizationBranding } from '../contexts/EnhancedThemeContext'
import EnhancedCard, { CardHeader, CardContent, CardFooter } from './ui/EnhancedCard'
import Button from './ui/Button'
import { animationVariants } from '../utils/animations'
import { meetsWCAGContrast, announceToScreenReader } from '../utils/accessibility'

interface ThemeCustomizerProps {
  isOpen: boolean
  onClose: () => void
}

const ThemeCustomizer: React.FC<ThemeCustomizerProps> = ({ isOpen, onClose }) => {
  const { 
    currentTheme, 
    availableThemes, 
    setTheme, 
    organizationBranding, 
    setOrganizationBranding,
    applyCustomColors,
    resetTheme 
  } = useTheme()
  
  const [customColors, setCustomColors] = useState({
    primary: currentTheme.colors.primary,
    secondary: currentTheme.colors.secondary,
    accent: currentTheme.colors.accent,
  })
  
  const [orgBranding, setOrgBranding] = useState<Partial<OrganizationBranding>>({
    name: organizationBranding?.name || '',
    logo: organizationBranding?.logo || '',
    colors: organizationBranding?.colors || {},
    font: organizationBranding?.font || { family: 'Inter, system-ui, sans-serif', weights: [400, 500, 600, 700] }
  })
  
  const [activeTab, setActiveTab] = useState<'themes' | 'colors' | 'branding'>('themes')

  const handleThemeChange = (themeId: string) => {
    setTheme(themeId)
    announceToScreenReader(`Theme changed to ${availableThemes.find(t => t.id === themeId)?.name}`)
  }

  const handleColorChange = (colorType: keyof typeof customColors, value: string) => {
    setCustomColors(prev => ({ ...prev, [colorType]: value }))
  }

  const applyCustomTheme = () => {
    applyCustomColors(customColors)
    announceToScreenReader('Custom theme colors applied')
  }

  const handleBrandingSubmit = () => {
    if (orgBranding.name) {
      setOrganizationBranding({
        name: orgBranding.name,
        logo: orgBranding.logo,
        colors: orgBranding.colors || {},
        font: orgBranding.font || { family: 'Inter, system-ui, sans-serif', weights: [400, 500, 600, 700] }
      })
      announceToScreenReader('Organization branding updated')
    }
  }

  const exportTheme = () => {
    const themeData = {
      theme: currentTheme,
      branding: organizationBranding
    }
    const blob = new Blob([JSON.stringify(themeData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'gso-theme-config.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    announceToScreenReader('Theme configuration exported')
  }

  const importTheme = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const themeData = JSON.parse(e.target?.result as string)
          if (themeData.theme) {
            applyCustomColors(themeData.theme.colors)
          }
          if (themeData.branding) {
            setOrganizationBranding(themeData.branding)
          }
          announceToScreenReader('Theme configuration imported successfully')
        } catch (error) {
          announceToScreenReader('Failed to import theme configuration', 'assertive')
        }
      }
      reader.readAsText(file)
    }
  }

  const ColorPicker: React.FC<{
    label: string
    value: string
    onChange: (value: string) => void
    testText?: string
  }> = ({ label, value, onChange, testText = 'Sample Text' }) => {
    const backgroundColor = currentTheme.colors.background.primary
    const contrastRatio = meetsWCAGContrast(value, backgroundColor)
    
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-dark-text">
          {label}
        </label>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <input
              type="color"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-12 h-12 rounded border border-dark-border cursor-pointer"
              aria-label={`${label} color picker`}
            />
          </div>
          <div className="flex-1">
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-full px-3 py-2 bg-dark-card border border-dark-border rounded text-dark-text focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              placeholder="#000000"
              pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
            />
          </div>
          <div className="flex items-center space-x-2">
            {contrastRatio ? (
              <div className="flex items-center space-x-1 text-green-500">
                <Check className="w-4 h-4" />
                <span className="text-xs">WCAG</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1 text-red-500">
                <X className="w-4 h-4" />
                <span className="text-xs">Low</span>
              </div>
            )}
          </div>
        </div>
        <div 
          className="p-2 rounded text-center text-sm"
          style={{ color: value, backgroundColor }}
        >
          {testText}
        </div>
      </div>
    )
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        variants={animationVariants.modalBackdrop}
        initial="initial"
        animate="animate"
        exit="exit"
        onClick={onClose}
      >
        <motion.div
          className="w-full max-w-4xl max-h-[90vh] overflow-hidden"
          variants={animationVariants.modalContent}
          initial="initial"
          animate="animate"
          exit="exit"
          onClick={(e) => e.stopPropagation()}
        >
          <EnhancedCard variant="elevated" size="lg" className="overflow-hidden">
            <CardHeader
              title="Theme Customizer"
              subtitle="Personalize your GitSecureOps experience"
              icon={<Palette className="w-6 h-6 text-brand-primary" />}
              actions={
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              }
            />
            
            <CardContent className="max-h-[60vh] overflow-y-auto">
              {/* Tabs */}
              <div className="flex space-x-1 mb-6 bg-dark-bg rounded-lg p-1">
                {[
                  { id: 'themes', label: 'Themes', icon: Monitor },
                  { id: 'colors', label: 'Colors', icon: Palette },
                  { id: 'branding', label: 'Branding', icon: Eye }
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id as typeof activeTab)}
                    className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                      activeTab === id
                        ? 'bg-brand-primary text-white'
                        : 'text-dark-text-muted hover:text-dark-text hover:bg-dark-card'
                    }`}
                    aria-pressed={activeTab === id}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>

              {/* Theme Selection */}
              {activeTab === 'themes' && (
                <motion.div
                  variants={animationVariants.staggerContainer}
                  initial="initial"
                  animate="animate"
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {availableThemes.map((theme) => (
                      <motion.button
                        key={theme.id}
                        variants={animationVariants.staggerItem}
                        onClick={() => handleThemeChange(theme.id)}
                        className={`p-4 rounded-lg border-2 text-left transition-all ${
                          currentTheme.id === theme.id
                            ? 'border-brand-primary bg-brand-primary/10'
                            : 'border-dark-border hover:border-brand-primary/50'
                        }`}
                        aria-pressed={currentTheme.id === theme.id}
                      >
                        <div className="flex items-center space-x-3 mb-3">
                          {theme.mode === 'dark' ? (
                            <Moon className="w-5 h-5" />
                          ) : (
                            <Sun className="w-5 h-5" />
                          )}
                          <span className="font-medium">{theme.name}</span>
                        </div>
                        <div className="flex space-x-1">
                          {[
                            theme.colors.primary,
                            theme.colors.secondary,
                            theme.colors.accent
                          ].map((color, index) => (
                            <div
                              key={index}
                              className="w-6 h-6 rounded"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Custom Colors */}
              {activeTab === 'colors' && (
                <motion.div
                  variants={animationVariants.staggerContainer}
                  initial="initial"
                  animate="animate"
                  className="space-y-6"
                >
                  <ColorPicker
                    label="Primary Color"
                    value={customColors.primary}
                    onChange={(value) => handleColorChange('primary', value)}
                    testText="Primary Button"
                  />
                  
                  <ColorPicker
                    label="Secondary Color"
                    value={customColors.secondary}
                    onChange={(value) => handleColorChange('secondary', value)}
                    testText="Secondary Action"
                  />
                  
                  <ColorPicker
                    label="Accent Color"
                    value={customColors.accent}
                    onChange={(value) => handleColorChange('accent', value)}
                    testText="Accent Element"
                  />
                  
                  <div className="flex space-x-3 pt-4">
                    <Button onClick={applyCustomTheme} className="flex-1">
                      <Check className="w-4 h-4 mr-2" />
                      Apply Colors
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setCustomColors({
                        primary: currentTheme.colors.primary,
                        secondary: currentTheme.colors.secondary,
                        accent: currentTheme.colors.accent
                      })}
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reset
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Organization Branding */}
              {activeTab === 'branding' && (
                <motion.div
                  variants={animationVariants.staggerContainer}
                  initial="initial"
                  animate="animate"
                  className="space-y-6"
                >
                  <div>
                    <label className="block text-sm font-medium text-dark-text mb-2">
                      Organization Name
                    </label>
                    <input
                      type="text"
                      value={orgBranding.name}
                      onChange={(e) => setOrgBranding(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Your Organization Name"
                      className="w-full px-3 py-2 bg-dark-card border border-dark-border rounded text-dark-text focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-text mb-2">
                      Logo URL
                    </label>
                    <input
                      type="url"
                      value={orgBranding.logo}
                      onChange={(e) => setOrgBranding(prev => ({ ...prev, logo: e.target.value }))}
                      placeholder="https://example.com/logo.png"
                      className="w-full px-3 py-2 bg-dark-card border border-dark-border rounded text-dark-text focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-text mb-2">
                      Font Family
                    </label>
                    <select
                      value={orgBranding.font?.family}
                      onChange={(e) => setOrgBranding(prev => ({ 
                        ...prev, 
                        font: { ...prev.font, family: e.target.value, weights: [400, 500, 600, 700] }
                      }))}
                      className="w-full px-3 py-2 bg-dark-card border border-dark-border rounded text-dark-text focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                    >
                      <option value="Inter, system-ui, sans-serif">Inter (Default)</option>
                      <option value="'Roboto', sans-serif">Roboto</option>
                      <option value="'Open Sans', sans-serif">Open Sans</option>
                      <option value="'Poppins', sans-serif">Poppins</option>
                      <option value="'Source Sans Pro', sans-serif">Source Sans Pro</option>
                    </select>
                  </div>

                  <Button onClick={handleBrandingSubmit} className="w-full">
                    <Check className="w-4 h-4 mr-2" />
                    Apply Branding
                  </Button>
                </motion.div>
              )}
            </CardContent>

            <CardFooter className="flex-wrap">
              <div className="flex space-x-2 mr-auto">
                <input
                  type="file"
                  accept=".json"
                  onChange={importTheme}
                  className="hidden"
                  id="import-theme"
                />
                <label htmlFor="import-theme">
                  <Button variant="outline" size="sm" className="cursor-pointer">
                    <Upload className="w-4 h-4 mr-2" />
                    Import
                  </Button>
                </label>
                <Button variant="outline" size="sm" onClick={exportTheme}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
              
              <div className="flex space-x-2">
                <Button variant="outline" onClick={resetTheme}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset All
                </Button>
                <Button onClick={onClose}>
                  Done
                </Button>
              </div>
            </CardFooter>
          </EnhancedCard>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default ThemeCustomizer
