import pygame
import random
import math
import sys
import json
import os

# Initialize Pygame
pygame.init()

# Constants
SCREEN_WIDTH = 800
SCREEN_HEIGHT = 600
FPS = 60

# Colors
BLACK = (0, 0, 0)
WHITE = (255, 255, 255)
RED = (255, 0, 0)
GREEN = (0, 255, 0)
BLUE = (0, 0, 255)
YELLOW = (255, 255, 0)
GRAY = (128, 128, 128)
ORANGE = (255, 165, 0)
DARK_RED = (150, 0, 0)
GOLD = (255, 215, 0)

class Orb:
    def __init__(self, x, y):
        self.x = x
        self.y = y
        self.size = 5
        self.collected = False
        self.collection_range = 20
        self.magnet_range = 80  # Magnet effect range
        self.magnet_speed = 6  # Speed at which orb moves toward player

    def update(self, player):
        # Magnet effect: move toward player if within magnet_range
        dx = player.x - self.x
        dy = player.y - self.y
        distance = math.sqrt(dx * dx + dy * dy)

        if distance < self.collection_range:
            self.collected = True
            return True
        elif distance < self.magnet_range:
            # Move orb toward player
            if distance > 0:
                self.x += (dx / distance) * self.magnet_speed
                self.y += (dy / distance) * self.magnet_speed
        return False

    def draw(self, screen):
        if not self.collected:
            pygame.draw.circle(screen, GREEN, (int(self.x), int(self.y)), self.size)
            # Draw glow effect
            pygame.draw.circle(screen, (0, 150, 0), (int(self.x), int(self.y)), self.size + 2, 1)

class Player:
    def __init__(self, x, y):
        self.x = x
        self.y = y
        self.size = 20
        self.speed = 5
        self.last_shot = 0
        self.base_shoot_delay = 200  # Base delay between shots
        self.shoot_delay = 200  # Current delay (will be modified by level)
        self.health = 10
        self.max_health = 10
        self.last_damage_time = 0
        self.damage_cooldown = 1000  # 1 second in milliseconds
        
    def update_shoot_speed(self, level):
        """Update shoot speed based on level"""
        # Each level makes you shoot faster
        speed_multiplier = 2 ** (level - 1)  # 1x, 2x, 4x, 8x, etc.
        self.shoot_delay = max(25, self.base_shoot_delay // speed_multiplier)  # Minimum 25ms delay
        
    def update(self):
        keys = pygame.key.get_pressed()
        
        # Movement
        if keys[pygame.K_w] or keys[pygame.K_UP]:
            self.y -= self.speed
        if keys[pygame.K_s] or keys[pygame.K_DOWN]:
            self.y += self.speed
        if keys[pygame.K_a] or keys[pygame.K_LEFT]:
            self.x -= self.speed
        if keys[pygame.K_d] or keys[pygame.K_RIGHT]:
            self.x += self.speed
            
        # Keep player on screen
        self.x = max(self.size, min(SCREEN_WIDTH - self.size, self.x))
        self.y = max(self.size, min(SCREEN_HEIGHT - self.size, self.y))
        
    def shoot(self, mouse_pos, current_time, level):
        if current_time - self.last_shot > self.shoot_delay:
            dx = mouse_pos[0] - self.x
            dy = mouse_pos[1] - self.y
            distance = math.sqrt(dx * dx + dy * dy)
            bullets = []
            if distance > 0:
                # Normalize direction
                dx /= distance
                dy /= distance
                # Calculate angle to mouse
                base_angle = math.atan2(dy, dx)
                
                # Level 7+ uses red bullets with 7x damage
                if level >= 7:
                    num_streams = level - 6  # Level 7 = 1 stream, Level 8 = 2 streams, etc.
                    damage = 7
                    is_red = True
                else:
                    # Determine number of streams for levels 1-6
                    if level < 3:
                        num_streams = 1
                    else:
                        num_streams = level
                    damage = 1
                    is_red = False
                
                # Spread bullets in an arc (up to 60 degrees)
                spread = math.radians(60)
                if num_streams > 1:
                    start_angle = base_angle - spread/2
                    angle_step = spread / (num_streams - 1)
                else:
                    start_angle = base_angle
                    angle_step = 0
                for i in range(num_streams):
                    angle = start_angle + i * angle_step
                    b_dx = math.cos(angle) * 10
                    b_dy = math.sin(angle) * 10
                    bullets.append(Bullet(self.x, self.y, b_dx, b_dy, damage, is_red))
                self.last_shot = current_time
                return bullets
        return []
        
    def take_damage(self, current_time):
        if current_time - self.last_damage_time > self.damage_cooldown:
            self.health -= 1
            self.last_damage_time = current_time
            return self.health <= 0  # Return True if dead
        return False
        
    def draw(self, screen):
        pygame.draw.circle(screen, WHITE, (int(self.x), int(self.y)), self.size)
        
        # Draw health bar above player
        bar_width = 40
        bar_height = 6
        bar_x = self.x - bar_width // 2
        bar_y = self.y - self.size - 15
        
        # Background
        pygame.draw.rect(screen, BLACK, (bar_x, bar_y, bar_width, bar_height))
        # Health
        health_width = (self.health / self.max_health) * bar_width
        health_color = GREEN if self.health > 6 else (255, 165, 0) if self.health > 3 else RED
        pygame.draw.rect(screen, health_color, (bar_x, bar_y, health_width, bar_height))

class FinalBossBullet:
    def __init__(self, x, y, dx, dy):
        self.x = x
        self.y = y
        self.dx = dx
        self.dy = dy
        self.size = 8  # Medium-sized bullets
        self.damage = 0.5  # 0.5 damage per bullet
        self.is_final_boss_bullet = True
        
    def update(self):
        self.x += self.dx
        self.y += self.dy
        
    def is_off_screen(self):
        return (self.x < -50 or self.x > SCREEN_WIDTH + 50 or 
                self.y < -50 or self.y > SCREEN_HEIGHT + 50)
                
    def draw(self, screen):
        # Draw medium golden bullet with glow effect
        pygame.draw.circle(screen, GOLD, (int(self.x), int(self.y)), self.size)
        # Add glow effect
        for i in range(2):
            glow_size = self.size + (i * 3)
            glow_alpha = 120 - (i * 40)
            glow_surface = pygame.Surface((glow_size * 2, glow_size * 2), pygame.SRCALPHA)
            pygame.draw.circle(glow_surface, (*GOLD, glow_alpha), (glow_size, glow_size), glow_size, 2)
            screen.blit(glow_surface, (self.x - glow_size, self.y - glow_size))

class SmallBullet:
    def __init__(self, x, y, dx, dy):
        self.x = x
        self.y = y
        self.dx = dx
        self.dy = dy
        self.size = 4  # Small bullet
        self.damage = 1
        self.is_enemy_bullet = True
        
    def update(self):
        self.x += self.dx
        self.y += self.dy
        
    def is_off_screen(self):
        return (self.x < -30 or self.x > SCREEN_WIDTH + 30 or 
                self.y < -30 or self.y > SCREEN_HEIGHT + 30)
                
    def draw(self, screen):
        # Draw small red bullet
        pygame.draw.circle(screen, RED, (int(self.x), int(self.y)), self.size)

class BossBullet:
    def __init__(self, x, y, dx, dy):
        self.x = x
        self.y = y
        self.dx = dx
        self.dy = dy
        self.size = 20  # Same size as player
        self.damage = 2
        self.is_boss_bullet = True
        
    def update(self):
        self.x += self.dx
        self.y += self.dy
        
    def is_off_screen(self):
        return (self.x < -50 or self.x > SCREEN_WIDTH + 50 or 
                self.y < -50 or self.y > SCREEN_HEIGHT + 50)
                
    def draw(self, screen):
        # Draw large red bullet with glow effect
        pygame.draw.circle(screen, RED, (int(self.x), int(self.y)), self.size)
        # Add glow effect
        for i in range(3):
            glow_size = self.size + (i * 4)
            glow_alpha = 80 - (i * 25)
            glow_surface = pygame.Surface((glow_size * 2, glow_size * 2), pygame.SRCALPHA)
            pygame.draw.circle(glow_surface, (*RED, glow_alpha), (glow_size, glow_size), glow_size, 2)
            screen.blit(glow_surface, (self.x - glow_size, self.y - glow_size))

class Bullet:
    def __init__(self, x, y, dx, dy, damage=1, is_red=False):
        self.x = x
        self.y = y
        self.dx = dx
        self.dy = dy
        self.size = 3
        self.damage = damage
        self.is_red = is_red
        
    def update(self):
        self.x += self.dx
        self.y += self.dy
        
    def is_off_screen(self):
        return (self.x < 0 or self.x > SCREEN_WIDTH or 
                self.y < 0 or self.y > SCREEN_HEIGHT)
                
    def draw(self, screen):
        color = RED if self.is_red else YELLOW
        pygame.draw.circle(screen, color, (int(self.x), int(self.y)), self.size)

class Zombie:
    def __init__(self, x, y, is_buff=False, is_green=False, is_black=False):
        self.x = x
        self.y = y
        self.is_buff = is_buff
        self.is_green = is_green
        self.is_black = is_black
        self.last_shot = 0
        self.shoot_delay = 4000  # Shoots every 4 seconds for black enemies
        
        if is_black:
            self.size = 35  # Large black enemy
            self.speed = 1.2  # Medium speed
            self.health = 560  # 5x green enemy health (112 * 5)
            self.max_health = 560
        elif is_green:
            self.size = 7  # 2x smaller than normal (15 / 2)
            self.speed = 2.0  # Fast due to small size
            self.health = 112  # 30% less than 160 (160 * 0.7)
            self.max_health = 112
        elif is_buff:
            self.size = 45  # 3x bigger than normal (15 * 3)
            self.speed = 1.0  # Slightly slower due to size
            self.health = 16  # 2x stronger than before (8 * 2), 8x stronger than normal
            self.max_health = 16
        else:
            self.size = 15
            self.speed = 1.5
            self.health = 2
            self.max_health = 2
        
    def update(self, player):
        # Move towards player
        dx = player.x - self.x
        dy = player.y - self.y
        distance = math.sqrt(dx * dx + dy * dy)
        
        if distance > 0:
            # Normalize and apply speed
            dx = (dx / distance) * self.speed
            dy = (dy / distance) * self.speed
            
            self.x += dx
            self.y += dy
    
    def shoot(self, current_time):
        """Black enemies shoot 10 small bullets around them"""
        if self.is_black and current_time - self.last_shot > self.shoot_delay:
            bullets = []
            for i in range(10):
                angle = (i / 10) * 2 * math.pi  # 10 bullets in circle
                dx = math.cos(angle) * 4  # Speed of 4
                dy = math.sin(angle) * 4
                bullets.append(SmallBullet(self.x, self.y, dx, dy))
            self.last_shot = current_time
            return bullets
        return []
            
    def take_damage(self, damage):
        self.health -= damage
        return self.health <= 0
        
    def draw(self, screen):
        # Draw zombie body
        if self.is_black:
            color = BLACK
        elif self.is_green:
            color = GREEN
        elif self.is_buff:
            color = ORANGE
        else:
            color = RED if self.health == self.max_health else (150, 0, 0)
        pygame.draw.circle(screen, color, (int(self.x), int(self.y)), self.size)
        
        # Draw health bar
        if self.health < self.max_health:
            if self.is_black:
                bar_width = 50
                bar_height = 8
            elif self.is_green:
                bar_width = 40
                bar_height = 8
            elif self.is_buff:
                bar_width = 30
                bar_height = 6
            else:
                bar_width = 20
                bar_height = 4
            bar_x = self.x - bar_width // 2
            bar_y = self.y - self.size - 10
            pygame.draw.rect(screen, BLACK, (bar_x, bar_y, bar_width, bar_height))
            health_width = (self.health / self.max_health) * bar_width
            pygame.draw.rect(screen, GREEN, (bar_x, bar_y, health_width, bar_height))

class FinalBoss:
    def __init__(self, x, y):
        self.x = x
        self.y = y
        self.size = 80  # Even larger than first boss
        self.speed = 0.6  # Slower due to massive size
        self.health = 50000  # 50k health
        self.max_health = 50000
        self.damage = 5
        self.last_shot = 0
        self.shoot_delay = 500  # Shoots every 0.5 seconds
        self.last_damage_time = 0
        self.damage_cooldown = 5000  # Can only damage player every 5 seconds
        
    def update(self, player):
        # Move towards player
        dx = player.x - self.x
        dy = player.y - self.y
        distance = math.sqrt(dx * dx + dy * dy)
        
        if distance > 0:
            # Normalize and apply speed
            dx = (dx / distance) * self.speed
            dy = (dy / distance) * self.speed
            
            self.x += dx
            self.y += dy
            
    def shoot(self, player, current_time):
        if current_time - self.last_shot > self.shoot_delay:
            bullets = []
            # Shoot 30 bullets in all directions around the boss
            for i in range(30):
                angle = (i / 30) * 2 * math.pi  # Divide 360 degrees into 30 equal parts
                dx = math.cos(angle) * 5  # Speed of 5
                dy = math.sin(angle) * 5
                bullets.append(FinalBossBullet(self.x, self.y, dx, dy))
            
            self.last_shot = current_time
            return bullets
        return []
        
    def take_damage(self, damage):
        self.health -= damage
        return self.health <= 0
        
    def can_damage_player(self, current_time):
        return current_time - self.last_damage_time > self.damage_cooldown
        
    def damage_player(self, current_time):
        self.last_damage_time = current_time
        
    def draw(self, screen):
        # Draw boss body (golden with red aura)
        pygame.draw.circle(screen, GOLD, (int(self.x), int(self.y)), self.size)
        # Red aura effect
        for i in range(4):
            aura_size = self.size + (i * 10)
            aura_alpha = 80 - (i * 20)
            aura_surface = pygame.Surface((aura_size * 2, aura_size * 2), pygame.SRCALPHA)
            pygame.draw.circle(aura_surface, (*RED, aura_alpha), (aura_size, aura_size), aura_size, 4)
            screen.blit(aura_surface, (self.x - aura_size, self.y - aura_size))

class Boss:
    def __init__(self, x, y):
        self.x = x
        self.y = y
        self.size = 60  # Large boss
        self.speed = 0.8  # Slower than normal enemies
        self.health = 25200  # 1.5x previous health (16800 * 1.5)
        self.max_health = 25200
        self.damage = 5
        self.last_shot = 0
        self.shoot_delay = 1000  # Shoots every 1 second (was 2.5 seconds)
        self.last_damage_time = 0
        self.damage_cooldown = 5000  # Can only damage player every 5 seconds
        
    def update(self, player):
        # Move towards player
        dx = player.x - self.x
        dy = player.y - self.y
        distance = math.sqrt(dx * dx + dy * dy)
        
        if distance > 0:
            # Normalize and apply speed
            dx = (dx / distance) * self.speed
            dy = (dy / distance) * self.speed
            
            self.x += dx
            self.y += dy
            
    def shoot(self, player, current_time):
        if current_time - self.last_shot > self.shoot_delay:
            bullets = []
            # Shoot 20 bullets in all directions around the boss
            for i in range(20):
                angle = (i / 20) * 2 * math.pi  # Divide 360 degrees into 20 equal parts
                dx = math.cos(angle) * 6  # Speed of 6 in each direction
                dy = math.sin(angle) * 6
                bullets.append(BossBullet(self.x, self.y, dx, dy))
            
            self.last_shot = current_time
            return bullets
        return []
        
    def take_damage(self, damage):
        self.health -= damage
        return self.health <= 0
        
    def can_damage_player(self, current_time):
        return current_time - self.last_damage_time > self.damage_cooldown
        
    def damage_player(self, current_time):
        self.last_damage_time = current_time
        
    def draw(self, screen):
        # Draw boss body (black with red glow)
        pygame.draw.circle(screen, BLACK, (int(self.x), int(self.y)), self.size)
        # Red radiating effect
        for i in range(3):
            glow_size = self.size + (i * 8)
            glow_alpha = 100 - (i * 30)
            glow_surface = pygame.Surface((glow_size * 2, glow_size * 2), pygame.SRCALPHA)
            pygame.draw.circle(glow_surface, (*DARK_RED, glow_alpha), (glow_size, glow_size), glow_size, 3)
            screen.blit(glow_surface, (self.x - glow_size, self.y - glow_size))

class Game:
    def __init__(self):
        self.screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
        pygame.display.set_caption("Zombie Shooter")
        self.clock = pygame.time.Clock()
        
        self.player = Player(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2)
        self.bullets = []
        self.zombies = []
        self.orbs = []
        self.score = 0
        self.zombie_spawn_timer = 0
        self.zombie_spawn_delay = 2000  # 2 seconds
        self.zombies_spawned = 0  # Track total zombies spawned for buff enemy timing
        
        # Orb and level system
        self.orbs_collected = 0
        self.level = 1
        self.orbs_needed = 10  # Start with 10 orbs needed for level 2
        
        # Boss system
        self.boss = None
        self.boss_spawned = False
        self.boss_defeated = False
        
        # Final boss system
        self.final_boss = None
        self.final_boss_spawned = False
        self.final_boss_defeated = False
        
        # Black enemy system
        self.green_spawn_count = 0  # Track green enemy spawns for black enemy timing
        
        # Pause system
        self.paused = False
        
        # Cheat system
        self.cheat_start_time = 0
        self.cheat_active = False
        
        # Second cheat system (T + 2 for level 25)
        self.cheat2_start_time = 0
        self.cheat2_active = False
        
        self.font = pygame.font.Font(None, 36)
        
    def spawn_orbs(self, x, y, count):
        """Spawn orbs at the given position"""
        for _ in range(count):
            # Spread orbs around the death location
            offset_x = random.randint(-15, 15)
            offset_y = random.randint(-15, 15)
            orb = Orb(x + offset_x, y + offset_y)
            self.orbs.append(orb)
    
    def check_level_up(self):
        """Check if player should level up"""
        if self.orbs_collected >= self.orbs_needed:
            self.level += 1
            self.orbs_collected = 0
            self.orbs_needed = self.level * 10  # 10, 20, 30, 40, etc.
            # Update player shoot speed
            self.player.update_shoot_speed(self.level)
            return True
        return False
    
    def draw_orb_bar(self):
        """Draw the orb collection progress bar at the top"""
        bar_width = 300  # Smaller bar width
        bar_height = 15  # Smaller bar height
        bar_x = 200  # Move right to avoid score overlap
        bar_y = 10  # Move up to top
        
        # Background
        pygame.draw.rect(self.screen, GRAY, (bar_x, bar_y, bar_width, bar_height))
        pygame.draw.rect(self.screen, BLACK, (bar_x, bar_y, bar_width, bar_height), 2)
        
        # Progress
        progress = self.orbs_collected / self.orbs_needed
        progress_width = progress * bar_width
        pygame.draw.rect(self.screen, GREEN, (bar_x, bar_y, progress_width, bar_height))
        
        # Text
        level_text = pygame.font.Font(None, 28).render(f"Lv.{self.level}", True, WHITE)
        orb_text = pygame.font.Font(None, 20).render(f"{self.orbs_collected}/{self.orbs_needed}", True, WHITE)
        
        self.screen.blit(level_text, (bar_x - 50, bar_y - 2))
        self.screen.blit(orb_text, (bar_x + bar_width + 10, bar_y - 2))

    def draw_boss_bar(self):
        """Draw boss health bar at bottom of screen"""
        boss_to_draw = self.final_boss if self.final_boss else self.boss
        boss_name = "HANAKO DEMON FOX" if self.final_boss else "MAKS GOD OF WAR"
        
        if boss_to_draw:
            bar_width = SCREEN_WIDTH - 40
            bar_height = 25
            bar_x = 20
            bar_y = SCREEN_HEIGHT - 60
            
            # Background
            pygame.draw.rect(self.screen, GRAY, (bar_x, bar_y, bar_width, bar_height))
            pygame.draw.rect(self.screen, BLACK, (bar_x, bar_y, bar_width, bar_height), 3)
            
            # Health
            health_percent = boss_to_draw.health / boss_to_draw.max_health
            health_width = health_percent * bar_width
            bar_color = GOLD if self.final_boss else RED
            pygame.draw.rect(self.screen, bar_color, (bar_x, bar_y, health_width, bar_height))
            
            # Boss name
            boss_text = pygame.font.Font(None, 32).render(boss_name, True, WHITE)
            text_rect = boss_text.get_rect(center=(SCREEN_WIDTH//2, bar_y - 20))
            self.screen.blit(boss_text, text_rect)
            
            # Health text
            health_text = pygame.font.Font(None, 24).render(f"{boss_to_draw.health}/{boss_to_draw.max_health}", True, WHITE)
            health_rect = health_text.get_rect(center=(SCREEN_WIDTH//2, bar_y + bar_height//2))
            self.screen.blit(health_text, health_rect)

    def spawn_boss(self):
        """Spawn the boss at a random edge"""
        side = random.randint(0, 3)
        if side == 0:  # Top
            x = SCREEN_WIDTH // 2
            y = -60
        elif side == 1:  # Right
            x = SCREEN_WIDTH + 60
            y = SCREEN_HEIGHT // 2
        elif side == 2:  # Bottom
            x = SCREEN_WIDTH // 2
            y = SCREEN_HEIGHT + 60
        else:  # Left
            x = -60
            y = SCREEN_HEIGHT // 2
            
        self.boss = Boss(x, y)
        self.boss_spawned = True

    def spawn_final_boss(self):
        """Spawn the final boss at the center of the screen"""
        # Clear all enemies
        self.zombies.clear()
        self.boss = None
        
        # Spawn final boss at center
        self.final_boss = FinalBoss(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2)
        self.final_boss_spawned = True

    # ...existing code...

    def spawn_zombie(self):
        # Don't spawn regular zombies during final boss
        if self.final_boss:
            return
            
        # Don't spawn regular zombies if boss is active or if level 15+ and boss not defeated
        if self.boss or (self.level >= 15 and not self.boss_defeated):
            return
            
        # Spawn zombies from edges of screen
        side = random.randint(0, 3)
        if side == 0:  # Top
            x = random.randint(0, SCREEN_WIDTH)
            y = -20
        elif side == 1:  # Right
            x = SCREEN_WIDTH + 20
            y = random.randint(0, SCREEN_HEIGHT)
        elif side == 2:  # Bottom
            x = random.randint(0, SCREEN_WIDTH)
            y = SCREEN_HEIGHT + 20
        else:  # Left
            x = -20
            y = random.randint(0, SCREEN_HEIGHT)

        # After level 5, only spawn orange and green enemies
        if self.level >= 10:
            # Level 10+: Green enemies and black enemies
            self.green_spawn_count += 1
            if self.green_spawn_count % 20 == 0:
                # Spawn black enemy every 20 green enemies
                self.zombies.append(Zombie(x, y, is_buff=False, is_green=False, is_black=True))
            else:
                # Spawn green enemy
                self.zombies.append(Zombie(x, y, is_buff=False, is_green=True, is_black=False))
        elif self.level >= 5:
            # Level 5-9: Track orange boss spawns for green enemy timing
            if not hasattr(self, 'orange_spawn_count'):
                self.orange_spawn_count = 0
            self.orange_spawn_count += 1
            if self.orange_spawn_count % 15 == 0:
                self.zombies.append(Zombie(x, y, is_buff=False, is_green=True, is_black=False))
            else:
                self.zombies.append(Zombie(x, y, is_buff=True, is_green=False, is_black=False))
        else:
            # Every 5th zombie is a buff zombie
            is_buff = (self.zombies_spawned + 1) % 5 == 0
            self.zombies.append(Zombie(x, y, is_buff=is_buff, is_green=False, is_black=False))
        self.zombies_spawned += 1
        
    def check_collisions(self, current_time):
        # Bullet-zombie collisions and enemy bullet-player collisions
        for bullet in self.bullets[:]:
            # Check if enemy bullet hits player (boss bullets, final boss bullets, or black enemy bullets)
            if (hasattr(bullet, 'is_boss_bullet') and bullet.is_boss_bullet) or (hasattr(bullet, 'is_enemy_bullet') and bullet.is_enemy_bullet) or (hasattr(bullet, 'is_final_boss_bullet') and bullet.is_final_boss_bullet):
                dx = bullet.x - self.player.x
                dy = bullet.y - self.player.y
                distance = math.sqrt(dx * dx + dy * dy)
                
                if distance < bullet.size + self.player.size:
                    # Enemy bullet hit player!
                    self.bullets.remove(bullet)
                    self.player.health -= bullet.damage
                    if self.player.health <= 0:
                        return True  # Game over
                    break
            
            # Check boss collision (only for player bullets)
            elif self.boss and not hasattr(bullet, 'is_boss_bullet') and not hasattr(bullet, 'is_enemy_bullet') and not hasattr(bullet, 'is_final_boss_bullet'):
                dx = bullet.x - self.boss.x
                dy = bullet.y - self.boss.y
                distance = math.sqrt(dx * dx + dy * dy)
                
                if distance < bullet.size + self.boss.size:
                    # Hit boss!
                    self.bullets.remove(bullet)
                    if self.boss.take_damage(bullet.damage):
                        # Boss defeated!
                        self.spawn_orbs(self.boss.x, self.boss.y, 150)  # 150 orbs
                        self.boss = None
                        self.boss_defeated = True
                        self.score += 1000  # Huge score bonus
                    break
            
            # Check final boss collision (only for player bullets)
            elif self.final_boss and not hasattr(bullet, 'is_boss_bullet') and not hasattr(bullet, 'is_enemy_bullet') and not hasattr(bullet, 'is_final_boss_bullet'):
                dx = bullet.x - self.final_boss.x
                dy = bullet.y - self.final_boss.y
                distance = math.sqrt(dx * dx + dy * dy)
                
                if distance < bullet.size + self.final_boss.size:
                    # Hit final boss!
                    self.bullets.remove(bullet)
                    if self.final_boss.take_damage(bullet.damage):
                        # Final boss defeated!
                        self.spawn_orbs(self.final_boss.x, self.final_boss.y, 500)  # 500 orbs
                        self.final_boss = None
                        self.final_boss_defeated = True
                        self.score += 5000  # Massive score bonus
                    break
            
            # Check regular zombie collisions (only for player bullets)
            if not hasattr(bullet, 'is_boss_bullet') and not hasattr(bullet, 'is_enemy_bullet') and not hasattr(bullet, 'is_final_boss_bullet'):
                for zombie in self.zombies[:]:
                    dx = bullet.x - zombie.x
                    dy = bullet.y - zombie.y
                    distance = math.sqrt(dx * dx + dy * dy)
                    
                    if distance < bullet.size + zombie.size:
                        # Hit!
                        self.bullets.remove(bullet)
                        if zombie.take_damage(bullet.damage):
                            # Zombie died - spawn orbs and give points
                            if zombie.is_buff:
                                self.spawn_orbs(zombie.x, zombie.y, 7)  # 7 orbs for big guy
                                self.score += 80  # 8x points for super buff zombies
                            else:
                                self.spawn_orbs(zombie.x, zombie.y, 2)  # 2 orbs for normal zombie
                                self.score += 10
                            self.zombies.remove(zombie)
                        break
                    
        # Player-zombie collisions
        player_touching_zombie = False
        for zombie in self.zombies:
            dx = self.player.x - zombie.x
            dy = self.player.y - zombie.y
            distance = math.sqrt(dx * dx + dy * dy)
            
            if distance < self.player.size + zombie.size:
                player_touching_zombie = True
                break
                
        # Player-boss collision
        if self.boss:
            dx = self.player.x - self.boss.x
            dy = self.player.y - self.boss.y
            distance = math.sqrt(dx * dx + dy * dy)
            
            if distance < self.player.size + self.boss.size:
                if self.boss.can_damage_player(current_time):
                    self.player.health -= self.boss.damage
                    self.boss.damage_player(current_time)
                    if self.player.health <= 0:
                        return True  # Game over
        
        # Player-final boss collision
        if self.final_boss:
            dx = self.player.x - self.final_boss.x
            dy = self.player.y - self.final_boss.y
            distance = math.sqrt(dx * dx + dy * dy)
            
            if distance < self.player.size + self.final_boss.size:
                if self.final_boss.can_damage_player(current_time):
                    self.player.health -= self.final_boss.damage
                    self.final_boss.damage_player(current_time)
                    if self.player.health <= 0:
                        return True  # Game over
                
        # Deal damage if touching zombie
        if player_touching_zombie:
            if self.player.take_damage(current_time):
                return True  # Game over - player died
                
        return False
        
    def run(self):
        running = True
        game_over = False
        
        while running:
            current_time = pygame.time.get_ticks()
            
            # Handle events
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    running = False
                elif event.type == pygame.KEYDOWN:
                    if event.key == pygame.K_r and game_over:
                        # Restart game
                        self.__init__()
                        game_over = False
                    elif event.key == pygame.K_p and not game_over:
                        # Toggle pause
                        self.paused = not self.paused
                        
            if not game_over and not self.paused:
                # Check for cheat code (hold 1 + T for 3 seconds)
                keys = pygame.key.get_pressed()
                if keys[pygame.K_1] and keys[pygame.K_t]:
                    if not self.cheat_active:
                        self.cheat_start_time = current_time
                        self.cheat_active = True
                    elif current_time - self.cheat_start_time >= 3000:  # 3 seconds
                        # Skip to level 15
                        self.level = 15
                        self.orbs_collected = 0
                        self.orbs_needed = 150
                        self.player.update_shoot_speed(self.level)
                        self.cheat_active = False
                else:
                    self.cheat_active = False
                
                # Check for second cheat code (hold T + 2 for 3 seconds)
                if keys[pygame.K_t] and keys[pygame.K_2]:
                    if not self.cheat2_active:
                        self.cheat2_start_time = current_time
                        self.cheat2_active = True
                    elif current_time - self.cheat2_start_time >= 3000:  # 3 seconds
                        # Skip to level 25 (final boss)
                        self.level = 25
                        self.orbs_collected = 0
                        self.orbs_needed = 250
                        self.player.update_shoot_speed(self.level)
                        # Clear all enemies and bosses
                        self.zombies.clear()
                        self.boss = None
                        self.boss_spawned = True
                        self.boss_defeated = True
                        # Reset final boss flags to allow spawning
                        self.final_boss_spawned = False
                        self.final_boss_defeated = False
                        self.cheat2_active = False
                else:
                    self.cheat2_active = False
                
                # Update game objects
                self.player.update()
                
                # Auto-shoot towards mouse
                mouse_pos = pygame.mouse.get_pos()
                new_bullets = self.player.shoot(mouse_pos, current_time, self.level)
                for b in new_bullets:
                    self.bullets.append(b)
                
                # Update bullets
                for bullet in self.bullets[:]:
                    bullet.update()
                    if bullet.is_off_screen():
                        self.bullets.remove(bullet)
                        
                # Update zombies and handle black enemy shooting
                for zombie in self.zombies:
                    zombie.update(self.player)
                    # Black zombies shoot bullets
                    if zombie.is_black:
                        black_bullets = zombie.shoot(current_time)
                        for bullet in black_bullets:
                            self.bullets.append(bullet)
                
                # Check if boss should spawn
                if self.level >= 15 and self.level < 25 and not self.boss_spawned and not self.boss_defeated:
                    self.spawn_boss()
                
                # Check if final boss should spawn
                if self.level >= 25 and not self.final_boss_spawned and not self.final_boss_defeated:
                    self.spawn_final_boss()
                
                # Update boss
                if self.boss:
                    self.boss.update(self.player)
                    # Boss shooting
                    boss_bullets = self.boss.shoot(self.player, current_time)
                    for bullet in boss_bullets:
                        self.bullets.append(bullet)
                
                # Update final boss
                if self.final_boss:
                    self.final_boss.update(self.player)
                    # Final boss shooting
                    final_boss_bullets = self.final_boss.shoot(self.player, current_time)
                    for bullet in final_boss_bullets:
                        self.bullets.append(bullet)
                
                # Update orbs
                for orb in self.orbs[:]:
                    if orb.update(self.player):
                        self.orbs.remove(orb)
                        self.orbs_collected += 1
                
                # Check for level up
                if self.check_level_up():
                    # Level up effect - shooting speed already updated in check_level_up
                    pass
                    
                # Spawn zombies
                if current_time - self.zombie_spawn_timer > self.zombie_spawn_delay:
                    self.spawn_zombie()
                    self.zombie_spawn_timer = current_time
                    # Gradually increase spawn rate
                    self.zombie_spawn_delay = max(500, self.zombie_spawn_delay - 50)
                    
                    # Check collisions
                if self.check_collisions(current_time):
                    game_over = True
            
            # Draw everything
            self.screen.fill(BLACK)
            
            if not game_over:
                self.player.draw(self.screen)
                
                for bullet in self.bullets:
                    bullet.draw(self.screen)
                    
                for zombie in self.zombies:
                    zombie.draw(self.screen)
                
                for orb in self.orbs:
                    orb.draw(self.screen)
                
                # Draw boss
                if self.boss:
                    self.boss.draw(self.screen)
                
                # Draw final boss
                if self.final_boss:
                    self.final_boss.draw(self.screen)
                
                # Draw UI
                self.draw_orb_bar()
                
                # Draw boss bar
                if self.boss or self.final_boss:
                    self.draw_boss_bar()
                
                # Draw cheat progress if active
                if self.cheat_active:
                    progress = (current_time - self.cheat_start_time) / 3000.0
                    cheat_text = pygame.font.Font(None, 32).render(f"Skip to Level 15: {progress*100:.0f}%", True, YELLOW)
                    self.screen.blit(cheat_text, (SCREEN_WIDTH//2 - 120, 100))
                
                # Draw score
                score_text = self.font.render(f"Score: {self.score}", True, WHITE)
                self.screen.blit(score_text, (10, 10))
                
                # Draw player health
                health_text = pygame.font.Font(None, 28).render(f"Health: {self.player.health}/{self.player.max_health}", True, WHITE)
                self.screen.blit(health_text, (10, 40))
                
                # Draw instructions
                instruction_text = pygame.font.Font(None, 24).render("WASD to move, aim with mouse, P to pause, Hold 1+T for cheat", True, WHITE)
                self.screen.blit(instruction_text, (10, SCREEN_HEIGHT - 30))
                
            elif not game_over and self.paused:
                # Draw paused game state (everything frozen)
                self.player.draw(self.screen)
                
                for bullet in self.bullets:
                    bullet.draw(self.screen)
                    
                for zombie in self.zombies:
                    zombie.draw(self.screen)
                
                for orb in self.orbs:
                    orb.draw(self.screen)
                
                # Draw boss
                if self.boss:
                    self.boss.draw(self.screen)
                
                # Draw UI
                self.draw_orb_bar()
                
                # Draw boss bar
                if self.boss:
                    self.draw_boss_bar()
                
                # Draw score
                score_text = self.font.render(f"Score: {self.score}", True, WHITE)
                self.screen.blit(score_text, (10, 10))
                
                # Draw player health
                health_text = pygame.font.Font(None, 28).render(f"Health: {self.player.health}/{self.player.max_health}", True, WHITE)
                self.screen.blit(health_text, (10, 40))
                
                # Draw pause message
                pause_text = pygame.font.Font(None, 72).render("PAUSED", True, WHITE)
                pause_rect = pause_text.get_rect(center=(SCREEN_WIDTH//2, SCREEN_HEIGHT//2))
                pygame.draw.rect(self.screen, BLACK, pause_rect.inflate(20, 20))
                pygame.draw.rect(self.screen, WHITE, pause_rect.inflate(20, 20), 3)
                self.screen.blit(pause_text, pause_rect)
                
                unpause_text = pygame.font.Font(None, 36).render("Press P to resume", True, WHITE)
                unpause_rect = unpause_text.get_rect(center=(SCREEN_WIDTH//2, SCREEN_HEIGHT//2 + 60))
                self.screen.blit(unpause_text, unpause_rect)
                
            else:
                # Game over screen
                game_over_text = self.font.render("GAME OVER", True, RED)
                score_text = self.font.render(f"Final Score: {self.score}", True, WHITE)
                restart_text = pygame.font.Font(None, 24).render("Press R to restart", True, WHITE)
                
                game_over_rect = game_over_text.get_rect(center=(SCREEN_WIDTH//2, SCREEN_HEIGHT//2 - 50))
                score_rect = score_text.get_rect(center=(SCREEN_WIDTH//2, SCREEN_HEIGHT//2))
                restart_rect = restart_text.get_rect(center=(SCREEN_WIDTH//2, SCREEN_HEIGHT//2 + 50))
                
                self.screen.blit(game_over_text, game_over_rect)
                self.screen.blit(score_text, score_rect)
                self.screen.blit(restart_text, restart_rect)
            
            pygame.display.flip()
            self.clock.tick(FPS)
            
        pygame.quit()
        sys.exit()

if __name__ == "__main__":
    game = Game()
    game.run()
