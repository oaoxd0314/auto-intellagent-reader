import { Link, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { routeMap } from '@/router/routes'

export default function Navigation() {
  const location = useLocation()

  return (
    <nav className="bg-background border-b">
      <div className="container mx-auto px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-xl font-bold text-primary">
              AI Reader
            </Link>
            
            <div className="flex items-center space-x-4">
              {Object.entries(routeMap).map(([path, name]) => (
                <Link key={path} to={path}>
                  <Button 
                    variant={location.pathname === path ? "default" : "ghost"}
                    size="sm"
                  >
                    {name}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">
              基于文件系统路由
            </span>
          </div>
        </div>
      </div>
    </nav>
  )
} 