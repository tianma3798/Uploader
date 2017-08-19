using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;

namespace Core_Test.Controllers
{
    public class SingleController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }


        public IActionResult Thumb()
        {
            return View();
        }
    }
}