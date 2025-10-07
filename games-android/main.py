from kivy.app import App
from kivy.uix.widget import Widget
from kivy.core.window import Window
from kivy.clock import Clock
from kivy.graphics import Color, Ellipse, Rectangle
from kivy.vector import Vector
from kivy.core.text import Label as CoreLabel
import random
import math
import json

# Constants
SCREEN_WIDTH = 800
SCREEN_HEIGHT = 600

# Colors
BLACK = (0, 0, 0, 1)
WHITE = (1, 1, 1, 1)
RED = (1, 0, 0, 1)
GREEN = (0, 1, 0, 1)
BLUE = (0, 0, 1, 1)
YELLOW = (1, 1, 0, 1)
GRAY = (0.5, 0.5, 0.5, 1)
ORANGE = (1, 0.65, 0, 1)
DARK_RED = (0.59, 0, 0, 1)
GOLD = (1, 0.84, 0, 1)

class Orb:
    def __init__(self, x, y):
        self.pos = Vector(x, y)
        self.size = 5
        self.collected = False
        self.collection_range = 20
        self.magnet_range = 80
        self.magnet_speed = 6

    def update(self, player_pos):
        direction = Vector(player_pos) - self.pos
        distance = direction.length()

        if distance < self.collection_range:
            self.collected = True
            return True
        elif distance < self.magnet_range:
            if distance > 0:
                direction = direction.normalize() * self.magnet_speed
                self.pos += direction
        return False

class Player:
    def __init__(self, x, y):
        self.pos = Vector(x, y)
        self.size = 20
        self.speed = 5
        self.last_shot = 0
        self.base_shoot_delay = 200
        self.shoot_delay = 200
        self.health = 10
        self.max_health = 10
        self.last_damage_time = 0
        self.damage_cooldown = 1000
        self.touch_pos = Vector(0, 0)
        self.joystick_pos = Vector(0, 0)
        self.is_moving = False

    def update_shoot_speed(self, level):
        speed_multiplier = 2 ** (level - 1)
        self.shoot_delay = max(25, self.base_shoot_delay // speed_multiplier)

class Bullet:
    def __init__(self, x, y, dx, dy, damage=1, is_red=False):
        self.pos = Vector(x, y)
        self.velocity = Vector(dx, dy)
        self.size = 3
        self.damage = damage
        self.is_red = is_red

    def update(self):
        self.pos += self.velocity

    def is_off_screen(self):
        return (self.pos.x < 0 or self.pos.x > Window.width or 
                self.pos.y < 0 or self.pos.y > Window.height)

class Zombie:
    def __init__(self, x, y, is_buff=False, is_green=False, is_black=False):
        self.pos = Vector(x, y)
        self.is_buff = is_buff
        self.is_green = is_green
        self.is_black = is_black
        self.last_shot = 0
        self.shoot_delay = 4000

        if is_black:
            self.size = 35
            self.speed = 1.2
            self.health = 560
            self.max_health = 560
        elif is_green:
            self.size = 7
            self.speed = 2.0
            self.health = 112
            self.max_health = 112
        elif is_buff:
            self.size = 45
            self.speed = 1.0
            self.health = 16
            self.max_health = 16
        else:
            self.size = 15
            self.speed = 1.5
            self.health = 2
            self.max_health = 2

    def update(self, player_pos):
        direction = Vector(player_pos) - self.pos
        if direction.length() > 0:
            direction = direction.normalize() * self.speed
            self.pos += direction

class GameWidget(Widget):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.player = Player(Window.width / 2, Window.height / 2)
        self.bullets = []
        self.zombies = []
        self.orbs = []
        self.score = 0
        self.zombie_spawn_timer = 0
        self.zombie_spawn_delay = 2000
        self.zombies_spawned = 0
        
        self.orbs_collected = 0
        self.level = 1
        self.orbs_needed = 10
        
        self.green_spawn_count = 0
        self.paused = False
        
        # Touch controls
        self.move_joystick = Vector(100, 100)  # Left side joystick
        self.shoot_joystick = Vector(Window.width - 100, 100)  # Right side joystick
        self.joystick_size = 50
        self.active_touches = {}
        
        Clock.schedule_interval(self.update, 1.0 / 60.0)
        self._keyboard = Window.request_keyboard(self._on_keyboard_closed, self)
        self._keyboard.bind(on_key_down=self._on_key_down)
        self._keyboard.bind(on_key_up=self._on_key_up)

    def on_touch_down(self, touch):
        # Left side of screen controls movement
        if touch.x < Window.width / 2:
            self.active_touches['move'] = touch
            self.player.joystick_pos = Vector(touch.x, touch.y)
            self.player.is_moving = True
        # Right side controls shooting
        else:
            self.active_touches['shoot'] = touch
            self.player.touch_pos = Vector(touch.x, touch.y)

    def on_touch_move(self, touch):
        if touch.uid in self.active_touches:
            if self.active_touches[touch.uid] == 'move':
                self.player.joystick_pos = Vector(touch.x, touch.y)
            else:
                self.player.touch_pos = Vector(touch.x, touch.y)

    def on_touch_up(self, touch):
        if touch.uid in self.active_touches:
            if self.active_touches[touch.uid] == 'move':
                self.player.is_moving = False
            del self.active_touches[touch.uid]

    def _on_keyboard_closed(self):
        self._keyboard.unbind(on_key_down=self._on_key_down)
        self._keyboard.unbind(on_key_up=self._on_key_up)
        self._keyboard = None

    def update(self, dt):
        if self.paused:
            return

        # Update player position based on touch input
        if self.player.is_moving:
            direction = Vector(self.player.joystick_pos) - Vector(self.move_joystick)
            if direction.length() > self.joystick_size:
                direction = direction.normalize() * self.player.speed
                self.player.pos += direction

        # Spawn zombies
        self.zombie_spawn_timer += dt * 1000
        if self.zombie_spawn_timer > self.zombie_spawn_delay:
            self.spawn_zombie()
            self.zombie_spawn_timer = 0

        # Update game objects
        for bullet in self.bullets[:]:
            bullet.update()
            if bullet.is_off_screen():
                self.bullets.remove(bullet)

        for zombie in self.zombies:
            zombie.update(self.player.pos)

        for orb in self.orbs[:]:
            if orb.update(self.player.pos):
                self.orbs.remove(orb)
                self.orbs_collected += 1
                self.check_level_up()

        self.check_collisions()

    def spawn_zombie(self):
        side = random.randint(0, 3)
        if side == 0:  # Top
            x = random.randint(0, Window.width)
            y = -20
        elif side == 1:  # Right
            x = Window.width + 20
            y = random.randint(0, Window.height)
        elif side == 2:  # Bottom
            x = random.randint(0, Window.width)
            y = Window.height + 20
        else:  # Left
            x = -20
            y = random.randint(0, Window.height)

        if self.level >= 10:
            self.green_spawn_count += 1
            if self.green_spawn_count % 20 == 0:
                self.zombies.append(Zombie(x, y, is_black=True))
            else:
                self.zombies.append(Zombie(x, y, is_green=True))
        elif self.level >= 5:
            if (self.zombies_spawned + 1) % 15 == 0:
                self.zombies.append(Zombie(x, y, is_green=True))
            else:
                self.zombies.append(Zombie(x, y, is_buff=True))
        else:
            is_buff = (self.zombies_spawned + 1) % 5 == 0
            self.zombies.append(Zombie(x, y, is_buff=is_buff))

        self.zombies_spawned += 1

    def check_level_up(self):
        if self.orbs_collected >= self.orbs_needed:
            self.level += 1
            self.orbs_collected = 0
            self.orbs_needed = self.level * 10
            self.player.update_shoot_speed(self.level)
            return True
        return False

    def check_collisions(self):
        # Implementation similar to the original game
        pass

class ZombieShooterApp(App):
    def build(self):
        game = GameWidget()
        Window.size = (SCREEN_WIDTH, SCREEN_HEIGHT)
        return game

if __name__ == '__main__':
    ZombieShooterApp().run()