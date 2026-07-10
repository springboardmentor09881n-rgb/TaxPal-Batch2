import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar';
import { Navbar } from '../navbar/navbar';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, Sidebar, Navbar],
  templateUrl: './layout.html',
  styleUrl: './layout.css'
})
export class Layout {
  isSidebarOpen = false;

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }
}
