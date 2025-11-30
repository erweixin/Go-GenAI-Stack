import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ThemeToggle } from '@/components/theme-toggle'
import { H1, H2, H3, P, Lead, Muted, InlineCode } from '@/components/typography'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { Loading } from '@/components/ui/spinner'
import { Empty } from '@/components/ui/empty'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Home, Info, Palette, Plus, Settings, User } from 'lucide-react'

/**
 * 组件展示页面
 * 
 * 展示所有已安装的 shadcn/ui 组件和主题系统
 */
export default function ShowcasePage() {
  const navigate = useNavigate()
  const [progress, setProgress] = useState(50)
  const [sliderValue, setSliderValue] = useState([50])

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-50 bg-card shadow border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <H3 className="mb-0">UI Showcase</H3>
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink onClick={() => navigate('/')}>首页</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>组件展示</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="flex gap-2">
              <ThemeToggle />
              <Button variant="outline" onClick={() => navigate('/')}>
                <Home className="mr-2 h-4 w-4" /> 返回首页
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 主内容 */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* 标题区 */}
        <div className="mb-12">
          <H1>组件展示</H1>
          <Lead>shadcn/ui + Tailwind CSS 4 完整组件库</Lead>
          <Muted>共 31+ 组件，支持明暗主题切换</Muted>
        </div>

        {/* Typography */}
        <Section title="Typography 排版系统">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <H1>这是 H1 标题</H1>
              <H2>这是 H2 标题</H2>
              <H3>这是 H3 标题</H3>
              <P>这是段落文字。Lorem ipsum dolor sit amet, consectetur adipiscing elit.</P>
              <Lead>这是引导文字，用于重要的介绍性内容。</Lead>
              <Muted>这是次要文字，用于辅助说明。</Muted>
              <div>
                代码：<InlineCode>npm install shadcn</InlineCode>
              </div>
            </CardContent>
          </Card>
        </Section>

        {/* Buttons */}
        <Section title="Buttons 按钮">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4">
                <Button>Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
                <Button disabled>Disabled</Button>
                <Button size="sm">Small</Button>
                <Button size="lg">Large</Button>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> With Icon
                </Button>
              </div>
            </CardContent>
          </Card>
        </Section>

        {/* Form Controls */}
        <Section title="Form Controls 表单控件">
          <Card>
            <CardContent className="space-y-6 pt-6">
              {/* Input */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="your@email.com" />
              </div>

              {/* Textarea */}
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" placeholder="输入消息..." />
              </div>

              {/* Select */}
              <div className="space-y-2">
                <Label>Select</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="选择一个选项" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="option1">选项 1</SelectItem>
                    <SelectItem value="option2">选项 2</SelectItem>
                    <SelectItem value="option3">选项 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Checkbox & Switch */}
              <div className="flex items-center gap-8">
                <div className="flex items-center space-x-2">
                  <Checkbox id="terms" />
                  <Label htmlFor="terms">Accept terms</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="airplane" />
                  <Label htmlFor="airplane">Airplane mode</Label>
                </div>
              </div>

              {/* Radio Group */}
              <div className="space-y-2">
                <Label>Radio Group</Label>
                <RadioGroup defaultValue="option1">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="option1" id="r1" />
                    <Label htmlFor="r1">选项 1</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="option2" id="r2" />
                    <Label htmlFor="r2">选项 2</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Slider */}
              <div className="space-y-2">
                <Label>Slider: {sliderValue[0]}</Label>
                <Slider value={sliderValue} onValueChange={setSliderValue} max={100} step={1} />
              </div>

              {/* Progress */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Progress</Label>
                  <span className="text-sm text-muted-foreground">{progress}%</span>
                </div>
                <Progress value={progress} />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => setProgress(Math.max(0, progress - 10))}>-10</Button>
                  <Button size="sm" onClick={() => setProgress(Math.min(100, progress + 10))}>+10</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </Section>

        {/* Cards & Content */}
        <Section title="Cards & Content 卡片与内容">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Card Title</CardTitle>
                <CardDescription>Card description goes here</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">Some content inside the card.</p>
              </CardContent>
              <CardFooter>
                <Button className="w-full">Action</Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>With Avatar</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src="https://github.com/shadcn.png" />
                  <AvatarFallback>CN</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">Username</p>
                  <p className="text-sm text-muted-foreground">user@example.com</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>With Badges</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Badge>Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="destructive">Destructive</Badge>
              </CardContent>
            </Card>
          </div>
        </Section>

        {/* Alerts */}
        <Section title="Alerts 警告框">
          <div className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Info</AlertTitle>
              <AlertDescription>This is an informational alert.</AlertDescription>
            </Alert>
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>This is a destructive alert.</AlertDescription>
            </Alert>
          </div>
        </Section>

        {/* Dialogs & Popovers */}
        <Section title="Overlays 弹出层">
          <Card>
            <CardContent className="pt-6 flex flex-wrap gap-4">
              {/* Dialog */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">Open Dialog</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Dialog Title</DialogTitle>
                    <DialogDescription>
                      This is a dialog description.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">Dialog content goes here.</div>
                  <DialogFooter>
                    <Button>Confirm</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">Open Popover</Button>
                </PopoverTrigger>
                <PopoverContent>
                  <div className="space-y-2">
                    <h4 className="font-medium">Popover</h4>
                    <p className="text-sm text-muted-foreground">
                      This is a popover content.
                    </p>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Tooltip */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline">Hover me</Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>This is a tooltip</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Dropdown Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Settings className="mr-2 h-4 w-4" />
                    Menu
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Toast */}
              <Button
                variant="outline"
                onClick={() => {
                  toast.success('Success!', {
                    description: 'This is a success toast message.',
                  })
                }}
              >
                Show Toast
              </Button>
            </CardContent>
          </Card>
        </Section>

        {/* Tabs */}
        <Section title="Tabs 标签页">
          <Card>
            <CardContent className="pt-6">
              <Tabs defaultValue="tab1">
                <TabsList>
                  <TabsTrigger value="tab1">Tab 1</TabsTrigger>
                  <TabsTrigger value="tab2">Tab 2</TabsTrigger>
                  <TabsTrigger value="tab3">Tab 3</TabsTrigger>
                </TabsList>
                <TabsContent value="tab1">
                  <p className="text-sm">Content for Tab 1</p>
                </TabsContent>
                <TabsContent value="tab2">
                  <p className="text-sm">Content for Tab 2</p>
                </TabsContent>
                <TabsContent value="tab3">
                  <p className="text-sm">Content for Tab 3</p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </Section>

        {/* Accordion */}
        <Section title="Accordion 手风琴">
          <Card>
            <CardContent className="pt-6">
              <Accordion type="single" collapsible>
                <AccordionItem value="item-1">
                  <AccordionTrigger>Section 1</AccordionTrigger>
                  <AccordionContent>
                    Content for section 1. This can be expanded and collapsed.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>Section 2</AccordionTrigger>
                  <AccordionContent>
                    Content for section 2. This can be expanded and collapsed.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>Section 3</AccordionTrigger>
                  <AccordionContent>
                    Content for section 3. This can be expanded and collapsed.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </Section>

        {/* Table */}
        <Section title="Table 表格">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">John Doe</TableCell>
                    <TableCell>john@example.com</TableCell>
                    <TableCell>Admin</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost">Edit</Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Jane Smith</TableCell>
                    <TableCell>jane@example.com</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost">Edit</Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Section>

        {/* Loading & Empty States */}
        <Section title="States 状态">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Loading State</CardTitle>
              </CardHeader>
              <CardContent>
                <Loading text="正在加载..." />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Empty State</CardTitle>
              </CardHeader>
              <CardContent>
                <Empty
                  title="暂无数据"
                  description="点击下方按钮添加第一条数据"
                  action={<Button size="sm">添加数据</Button>}
                />
              </CardContent>
            </Card>
          </div>
        </Section>

        {/* Skeleton */}
        <Section title="Skeleton 骨架屏">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </CardContent>
          </Card>
        </Section>

        {/* Theme Demo */}
        <Section title="Theme System 主题系统">
          <Card>
            <CardHeader>
              <CardTitle>颜色演示</CardTitle>
              <CardDescription>所有颜色都支持明暗主题</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <ColorDemo color="background" label="Background" />
                <ColorDemo color="foreground" label="Foreground" />
                <ColorDemo color="primary" label="Primary" />
                <ColorDemo color="secondary" label="Secondary" />
                <ColorDemo color="muted" label="Muted" />
                <ColorDemo color="accent" label="Accent" />
                <ColorDemo color="destructive" label="Destructive" />
                <ColorDemo color="border" label="Border" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">主题切换</p>
                  <p className="text-sm text-muted-foreground">使用右上角的按钮切换主题</p>
                </div>
                <ThemeToggle />
              </div>
            </CardContent>
          </Card>
        </Section>

        {/* Animations */}
        <Section title="Animations 动画">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-primary/10 rounded-lg fade-in text-center">
                  <p className="text-sm font-medium">fade-in</p>
                </div>
                <div className="p-4 bg-primary/10 rounded-lg slide-in-from-top text-center">
                  <p className="text-sm font-medium">slide-in-from-top</p>
                </div>
                <div className="p-4 bg-primary/10 rounded-lg slide-in-from-bottom text-center">
                  <p className="text-sm font-medium">slide-in-from-bottom</p>
                </div>
                <div className="p-4 bg-primary/10 rounded-lg scale-in text-center">
                  <p className="text-sm font-medium">scale-in</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Section>
      </div>
    </div>
  )
}

// Helper Components
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <H2 className="mb-4">{title}</H2>
      {children}
    </section>
  )
}

function ColorDemo({ color, label }: { color: string; label: string }) {
  return (
    <div className="space-y-2">
      <div
        className={`h-20 rounded-lg border bg-${color}`}
        style={{ backgroundColor: `var(--${color})` }}
      />
      <p className="text-sm font-medium text-center">{label}</p>
    </div>
  )
}

